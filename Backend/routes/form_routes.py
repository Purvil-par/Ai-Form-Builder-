"""
Form Routes
Handles form CRUD operations with ownership and access control
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional
from models.user import UserResponse
from models.form_models import FormCreate, FormUpdate, FormResponse, FormStatus
from database.repositories import FormRepository
from auth.middleware import get_current_user
from datetime import datetime
import logging
import secrets
import string

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/forms", tags=["Forms"])


def generate_slug(title: str, length: int = 8) -> str:
    """Generate a unique URL-friendly slug"""
    # Convert title to slug format
    slug_base = title.lower().replace(" ", "-")
    slug_base = "".join(c for c in slug_base if c.isalnum() or c == "-")[:30]
    
    # Add random suffix for uniqueness
    random_suffix = ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(length))
    
    return f"{slug_base}-{random_suffix}"


def form_to_response(form: dict) -> dict:
    """Convert MongoDB form document to API response format"""
    from config import settings
    
    # Helper to serialize datetime
    def serialize_datetime(dt):
        if dt is None:
            return None
        if isinstance(dt, datetime):
            return dt.isoformat()
        return dt
    
    return {
        "id": str(form["_id"]),
        "owner_id": form["owner_id"],
        "slug": form["slug"],
        "title": form["title"],
        "description": form.get("description"),
        "fields": form["fields"],
        "globalStyles": form.get("globalStyles"),
        "ctaButton": form.get("ctaButton"),
        "status": form["status"],
        "version": form["version"],
        "public_url": f"{settings.FRONTEND_URL}/forms/{form['slug']}",
        "created_at": serialize_datetime(form["created_at"]),
        "updated_at": serialize_datetime(form["updated_at"]),
        "published_at": serialize_datetime(form.get("published_at")),
        "submission_count": form.get("submission_count", 0),
        "editorContent": form.get("editorContent")  # Rich content below form
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_form(
    form_data: FormCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Create a new form
    
    Requires authentication. Form will be owned by the current user.
    
    - **title**: Form title (required)
    - **description**: Form description (optional)
    - **fields**: List of form fields
    - **status**: draft or published (default: draft)
    """
    form_repo = FormRepository()
    
    # Generate unique slug
    slug = generate_slug(form_data.title)
    
    # Ensure slug is unique
    attempts = 0
    while await form_repo.slug_exists(slug) and attempts < 10:
        slug = generate_slug(form_data.title)
        attempts += 1
    
    if attempts >= 10:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate unique slug"
        )
    
    # Create form
    try:
        form = await form_repo.create(form_data, current_user.id, slug)
    except Exception as e:
        logger.error(f"Error creating form: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create form"
        )
    
    logger.info(f"Form created: {form['title']} by user {current_user.email}")
    
    # Return response with proper 'id' field
    return form_to_response(form)


@router.get("")
async def get_user_forms(
    skip: int = 0,
    limit: int = 50,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get all forms owned by the current user
    
    Requires authentication.
    
    - **skip**: Number of forms to skip (pagination)
    - **limit**: Maximum number of forms to return
    """
    form_repo = FormRepository()
    
    try:
        forms = await form_repo.get_user_forms(current_user.id, skip, limit)
    except Exception as e:
        logger.error(f"Error fetching user forms: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch forms"
        )
    
    # Convert to response format
    return [form_to_response(form) for form in forms]


@router.get("/{form_id}")
async def get_form(
    form_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get form by ID
    
    Requires authentication. Only the owner can access.
    
    - **form_id**: Form ID
    """
    form_repo = FormRepository()
    
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
            detail="You don't have permission to access this form"
        )
    
    return form_to_response(form)


@router.get("/public/{slug}")
async def get_public_form(slug: str):
    """
    Get form by slug (public access for viewing/submitting)
    
    No authentication required. Only published forms are accessible.
    
    - **slug**: Form slug
    """
    form_repo = FormRepository()
    
    form = await form_repo.get_by_slug(slug)
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Only allow access to published forms
    if form["status"] != FormStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    return form_to_response(form)


@router.put("/{form_id}")
async def update_form(
    form_id: str,
    update_data: FormUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update form
    
    Requires authentication. Only the owner can update.
    
    - **form_id**: Form ID
    - **update_data**: Fields to update
    """
    form_repo = FormRepository()
    
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
            detail="You don't have permission to update this form"
        )
    
    # Update form
    try:
        success = await form_repo.update(form_id, update_data, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update form"
            )
    except Exception as e:
        logger.error(f"Error updating form: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update form"
        )
    
    # Get updated form
    updated_form = await form_repo.get_by_id(form_id)
    
    logger.info(f"Form updated: {form_id} by user {current_user.email}")
    
    return form_to_response(updated_form)


@router.delete("/{form_id}")
async def delete_form(
    form_id: str,
    permanent: bool = False,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Delete or archive form
    
    Requires authentication. Only the owner can delete.
    
    - **form_id**: Form ID
    - **permanent**: If true, permanently delete. If false, archive (soft delete)
    """
    form_repo = FormRepository()
    
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
            detail="You don't have permission to delete this form"
        )
    
    try:
        if permanent:
            success = await form_repo.delete(form_id, current_user.id)
            message = "Form deleted permanently"
        else:
            success = await form_repo.archive(form_id, current_user.id)
            message = "Form archived successfully"
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete form"
            )
    except Exception as e:
        logger.error(f"Error deleting form: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete form"
        )
    
    logger.info(f"Form {'deleted' if permanent else 'archived'}: {form_id} by user {current_user.email}")
    
    return {"message": message}


@router.post("/{form_id}/publish")
async def publish_form(
    form_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Publish a draft form
    
    Requires authentication. Only the owner can publish.
    
    - **form_id**: Form ID
    """
    form_repo = FormRepository()
    
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
            detail="You don't have permission to publish this form"
        )
    
    # Update status to published
    update_data = FormUpdate(status=FormStatus.PUBLISHED)
    try:
        success = await form_repo.update(form_id, update_data, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to publish form"
            )
    except Exception as e:
        logger.error(f"Error publishing form: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to publish form"
        )
    
    # Get updated form
    updated_form = await form_repo.get_by_id(form_id)
    
    logger.info(f"Form published: {form_id} by user {current_user.email}")
    
    return form_to_response(updated_form)
