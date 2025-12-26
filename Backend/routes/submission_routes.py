"""
Submission Routes
Handles form submissions with rate limiting
"""

from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel
from typing import List, Optional
from models.user import UserResponse
from models.submission import SubmissionCreate, SubmissionResponse
from models.form_models import FormStatus
from database.repositories import SubmissionRepository, FormRepository
from auth.middleware import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Submissions"])


# Simple in-memory rate limiter (for production, use Redis)
submission_tracker = {}


def check_rate_limit(ip_address: str, form_id: str, limit: int = 10) -> bool:
    """
    Check if IP has exceeded submission rate limit
    
    Args:
        ip_address: Client IP address
        form_id: Form ID
        limit: Max submissions per hour
    
    Returns:
        bool: True if within limit, False if exceeded
    """
    from datetime import datetime, timedelta
    
    key = f"{ip_address}:{form_id}"
    now = datetime.utcnow()
    
    if key not in submission_tracker:
        submission_tracker[key] = []
    
    # Remove old entries (older than 1 hour)
    submission_tracker[key] = [
        timestamp for timestamp in submission_tracker[key]
        if now - timestamp < timedelta(hours=1)
    ]
    
    # Check limit
    if len(submission_tracker[key]) >= limit:
        return False
    
    # Add current timestamp
    submission_tracker[key].append(now)
    return True


@router.post("/forms/{slug}/submit", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_form(
    slug: str,
    submission_data: SubmissionCreate,
    request: Request
):
    """
    Submit a form (public endpoint with rate limiting)
    
    No authentication required. Form must be published.
    
    - **slug**: Form slug
    - **form_data**: Submitted form data (field_id -> value mapping)
    """
    form_repo = FormRepository()
    submission_repo = SubmissionRepository()
    
    # Get form by slug
    form = await form_repo.get_by_slug(slug)
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Check if form is published
    if form["status"] != FormStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    
    # Check rate limit
    from config import settings
    if not check_rate_limit(client_ip, str(form["_id"]), settings.FORM_SUBMISSION_RATE_LIMIT):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many submissions. Please try again later."
        )
    
    # Get user agent
    user_agent = request.headers.get("user-agent")
    
    # Create submission
    try:
        submission = await submission_repo.create(
            submission_data,
            str(form["_id"]),
            client_ip,
            user_agent
        )
    except Exception as e:
        logger.error(f"Error creating submission: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit form"
        )
    
    # Increment form submission count
    await form_repo.increment_submission_count(str(form["_id"]))
    
    # Create response
    submission_response = SubmissionResponse(
        _id=str(submission["_id"]),
        form_id=submission["form_id"],
        form_data=submission["form_data"],
        submitted_at=submission["submitted_at"],
        ip_address=submission.get("ip_address"),
        user_agent=submission.get("user_agent")
    )
    
    logger.info(f"Form submitted: {slug} from IP {client_ip}")
    
    # TODO: Send email notification to form owner
    
    return submission_response


@router.get("/forms/{form_id}/submissions", response_model=List[SubmissionResponse])
async def get_form_submissions(
    form_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get all submissions for a form
    
    Requires authentication. Only the form owner can access.
    
    - **form_id**: Form ID
    - **skip**: Number of submissions to skip (pagination)
    - **limit**: Maximum number of submissions to return
    """
    form_repo = FormRepository()
    submission_repo = SubmissionRepository()
    
    # Get form to check ownership
    form = await form_repo.get_by_id(form_id)
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Check ownership
    if form["owner_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access these submissions"
        )
    
    # Get submissions
    try:
        submissions = await submission_repo.get_form_submissions(form_id, skip, limit)
    except Exception as e:
        logger.error(f"Error fetching submissions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch submissions"
        )
    
    # Build responses
    submission_responses = []
    for submission in submissions:
        submission_responses.append(SubmissionResponse(
            _id=str(submission["_id"]),
            form_id=submission["form_id"],
            form_data=submission["form_data"],
            submitted_at=submission["submitted_at"],
            ip_address=submission.get("ip_address"),
            user_agent=submission.get("user_agent")
        ))
    
    return submission_responses


@router.get("/submissions/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get a single submission
    
    Requires authentication. Only the form owner can access.
    
    - **submission_id**: Submission ID
    """
    submission_repo = SubmissionRepository()
    form_repo = FormRepository()
    
    # Get submission
    submission = await submission_repo.get_by_id(submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Get form to check ownership
    form = await form_repo.get_by_id(submission["form_id"])
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Check ownership
    if form["owner_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this submission"
        )
    
    return SubmissionResponse(
        _id=str(submission["_id"]),
        form_id=submission["form_id"],
        form_data=submission["form_data"],
        submitted_at=submission["submitted_at"],
        ip_address=submission.get("ip_address"),
        user_agent=submission.get("user_agent")
    )


@router.delete("/submissions/{submission_id}")
async def delete_submission(
    submission_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Delete a submission
    
    Requires authentication. Only the form owner can delete.
    
    - **submission_id**: Submission ID
    """
    submission_repo = SubmissionRepository()
    form_repo = FormRepository()
    
    # Get submission
    submission = await submission_repo.get_by_id(submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Get form to check ownership
    form = await form_repo.get_by_id(submission["form_id"])
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Check ownership
    if form["owner_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this submission"
        )
    
    # Delete submission
    try:
        success = await submission_repo.delete(submission_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete submission"
            )
    except Exception as e:
        logger.error(f"Error deleting submission: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete submission"
        )
    
    logger.info(f"Submission deleted: {submission_id} by user {current_user.email}")
    
    return {"message": "Submission deleted successfully"}
