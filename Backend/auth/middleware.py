"""
Authentication Middleware
Provides authentication dependency for protected routes
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from .jwt_handler import decode_token
from database.repositories import UserRepository
from models.user import UserResponse
import logging

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserResponse:
    """
    Get current authenticated user from JWT token
    
    Args:
        credentials: HTTP Authorization credentials
    
    Returns:
        UserResponse: Current user information
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    
    # Decode token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user ID from payload
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user_repo = UserRepository()
    user = await user_repo.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Convert to UserResponse
    user_response = UserResponse(
        _id=str(user["_id"]),
        email=user["email"],
        full_name=user.get("full_name"),
        avatar_url=user.get("avatar_url"),
        is_active=user.get("is_active", True),
        is_verified=user.get("is_verified", False),
        created_at=user["created_at"],
        updated_at=user["updated_at"]
    )
    
    return user_response


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[UserResponse]:
    """
    Get current user if authenticated, None otherwise
    Useful for endpoints that work with or without authentication
    
    Args:
        credentials: Optional HTTP Authorization credentials
    
    Returns:
        Optional[UserResponse]: User if authenticated, None otherwise
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def require_auth(func):
    """
    Decorator to require authentication for a route
    Usage: @require_auth
    """
    async def wrapper(*args, current_user: UserResponse = Depends(get_current_user), **kwargs):
        return await func(*args, current_user=current_user, **kwargs)
    return wrapper
