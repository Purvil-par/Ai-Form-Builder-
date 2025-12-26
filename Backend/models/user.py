"""
User Model
Defines user schema and Pydantic models for validation
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from bson import ObjectId


class PyObjectId(str):
    """Custom ObjectId type for Pydantic v2"""
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        
        def validate(value):
            if isinstance(value, ObjectId):
                return str(value)
            if isinstance(value, str):
                if ObjectId.is_valid(value):
                    return value
                raise ValueError("Invalid ObjectId")
            raise ValueError("Invalid ObjectId type")
        
        return core_schema.with_info_plain_validator_function(
            validate,
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            )
        )


class UserBase(BaseModel):
    """Base user model with common fields"""
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    """Model for user registration"""
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserLogin(BaseModel):
    """Model for user login"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Model for updating user profile"""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    """Model for user response (excludes sensitive data)"""
    id: str = Field(alias="_id")
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class User(UserBase):
    """Complete user model for database storage"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    hashed_password: Optional[str] = None
    google_id: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    email_verified_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class GoogleUserInfo(BaseModel):
    """Model for Google OAuth user information"""
    email: EmailStr
    name: Optional[str] = None
    picture: Optional[str] = None
    google_id: str = Field(alias="sub")
    
    class Config:
        populate_by_name = True
