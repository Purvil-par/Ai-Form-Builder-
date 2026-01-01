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
    Supports session-based submission tracking for prefill and resubmission.
    
    - **slug**: Form slug
    - **form_data**: Submitted form data (field_id -> value mapping)
    - **session_id**: Optional session ID for tracking returning users (in metadata)
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
    
    # Get session ID from metadata (for prefill/resubmission tracking)
    session_id = None
    if submission_data.metadata and "session_id" in submission_data.metadata:
        session_id = submission_data.metadata["session_id"]
    
    # Get user agent
    user_agent = request.headers.get("user-agent")
    
    form_id = str(form["_id"])
    
    # Check if this session already has a submission (for resubmission)
    existing_submission = None
    if session_id:
        existing_submission = await submission_repo.get_by_session(form_id, session_id)
    
    try:
        if existing_submission:
            # Update existing submission instead of creating new
            submission = await submission_repo.update_by_session(
                form_id,
                session_id,
                submission_data.form_data
            )
            logger.info(f"Form resubmitted: {slug} from session {session_id}")
        else:
            # Check rate limit only for new submissions
            from config import settings
            if not check_rate_limit(client_ip, form_id, settings.FORM_SUBMISSION_RATE_LIMIT):
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many submissions. Please try again later."
                )
            
            # Create new submission
            submission = await submission_repo.create(
                submission_data,
                form_id,
                client_ip,
                user_agent,
                session_id
            )
            
            # Increment form submission count only for new submissions
            await form_repo.increment_submission_count(form_id)
            logger.info(f"Form submitted: {slug} from IP {client_ip}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating/updating submission: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit form"
        )
    
    # Create response
    submission_response = SubmissionResponse(
        _id=str(submission["_id"]),
        form_id=submission["form_id"],
        form_data=submission["form_data"],
        submitted_at=submission["submitted_at"],
        ip_address=submission.get("ip_address"),
        user_agent=submission.get("user_agent")
    )
    
    return submission_response


@router.get("/forms/{slug}/my-submission")
async def get_my_submission(
    slug: str,
    session_id: str,
    request: Request
):
    """
    Get user's previous submission for prefill (public endpoint)
    
    No authentication required. Used for form prefill when user returns.
    
    - **slug**: Form slug
    - **session_id**: User's session ID from localStorage
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
    
    form_id = str(form["_id"])
    
    # Get submission by session
    submission = await submission_repo.get_by_session(form_id, session_id)
    
    if not submission:
        # No previous submission found - return empty response
        return {"has_submission": False, "submission": None}
    
    # Return submission data for prefill
    return {
        "has_submission": True,
        "submission": {
            "id": str(submission["_id"]),
            "form_data": submission["form_data"],
            "submitted_at": submission["submitted_at"].isoformat() if submission.get("submitted_at") else None,
            "updated_at": submission.get("updated_at").isoformat() if submission.get("updated_at") else None
        }
    }


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
