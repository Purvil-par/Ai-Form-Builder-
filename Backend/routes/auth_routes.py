"""
Authentication Routes
Handles user registration, login, Google OAuth, and token management
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from models.user import UserCreate, UserLogin, UserResponse
from database.repositories import UserRepository
from auth.jwt_handler import create_access_token, create_refresh_token, decode_token
from auth.password import hash_password, verify_password
from auth.google_oauth import verify_google_token
from auth.middleware import get_current_user
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class TokenResponse(BaseModel):
    """Token response model"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class GoogleAuthRequest(BaseModel):
    """Google OAuth request"""
    token: str  # Google ID token from frontend


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user with email and password
    
    - **email**: Valid email address
    - **password**: Minimum 8 characters with uppercase, lowercase, and digit
    - **full_name**: Optional user's full name
    """
    user_repo = UserRepository()
    
    # Check if user already exists
    existing_user = await user_repo.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    try:
        user = await user_repo.create(user_data, hashed_password)
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    # Generate tokens
    token_data = {"sub": str(user["_id"]), "email": user["email"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Create response
    user_response = UserResponse(
        _id=str(user["_id"]),
        email=user["email"],
        full_name=user.get("full_name"),
        avatar_url=user.get("avatar_url"),
        is_active=user["is_active"],
        is_verified=user["is_verified"],
        created_at=user["created_at"],
        updated_at=user["updated_at"]
    )
    
    logger.info(f"User registered successfully: {user['email']}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_response
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    Login with email and password
    
    - **email**: Registered email address
    - **password**: User's password
    """
    user_repo = UserRepository()
    
    # Get user by email
    user = await user_repo.get_by_email(credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not user.get("hashed_password"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please login with Google"
        )
    
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Update last login
    await user_repo.update_last_login(str(user["_id"]))
    
    # Generate tokens
    token_data = {"sub": str(user["_id"]), "email": user["email"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Create response
    user_response = UserResponse(
        _id=str(user["_id"]),
        email=user["email"],
        full_name=user.get("full_name"),
        avatar_url=user.get("avatar_url"),
        is_active=user["is_active"],
        is_verified=user["is_verified"],
        created_at=user["created_at"],
        updated_at=user["updated_at"]
    )
    
    logger.info(f"User logged in successfully: {user['email']}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_response
    )


@router.post("/google", response_model=TokenResponse)
async def google_auth(auth_request: GoogleAuthRequest):
    """
    Authenticate with Google OAuth
    
    - **token**: Google ID token from frontend
    """
    # Verify Google token
    google_info = await verify_google_token(auth_request.token)
    if not google_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    
    user_repo = UserRepository()
    
    # Check if user exists by Google ID
    user = await user_repo.get_by_google_id(google_info["google_id"])
    
    if not user:
        # Check if user exists by email
        user = await user_repo.get_by_email(google_info["email"])
        
        if user:
            # Link Google account to existing user
            await user_repo.update(
                str(user["_id"]),
                {
                    "google_id": google_info["google_id"],
                    "avatar_url": google_info.get("picture"),
                    "is_verified": True,
                    "email_verified_at": datetime.utcnow()
                }
            )
        else:
            # Create new user from Google
            try:
                user = await user_repo.create_from_google(google_info)
            except Exception as e:
                logger.error(f"Error creating user from Google: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user"
                )
    
    # Update last login
    await user_repo.update_last_login(str(user["_id"]))
    
    # Generate tokens
    token_data = {"sub": str(user["_id"]), "email": user["email"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Create response
    user_response = UserResponse(
        _id=str(user["_id"]),
        email=user["email"],
        full_name=user.get("full_name"),
        avatar_url=user.get("avatar_url"),
        is_active=user["is_active"],
        is_verified=user["is_verified"],
        created_at=user["created_at"],
        updated_at=user["updated_at"]
    )
    
    logger.info(f"User authenticated with Google: {user['email']}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_response
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token
    
    - **refresh_token**: Valid refresh token
    """
    # Decode refresh token
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Get user
    user_repo = UserRepository()
    user = await user_repo.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Generate new tokens
    token_data = {"sub": str(user["_id"]), "email": user["email"]}
    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)
    
    # Create response
    user_response = UserResponse(
        _id=str(user["_id"]),
        email=user["email"],
        full_name=user.get("full_name"),
        avatar_url=user.get("avatar_url"),
        is_active=user["is_active"],
        is_verified=user["is_verified"],
        created_at=user["created_at"],
        updated_at=user["updated_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=user_response
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """
    Get current authenticated user information
    
    Requires: Bearer token in Authorization header
    """
    return current_user


@router.post("/logout")
async def logout(current_user: UserResponse = Depends(get_current_user)):
    """
    Logout user (client should delete tokens)
    
    Requires: Bearer token in Authorization header
    """
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Logged out successfully"}
