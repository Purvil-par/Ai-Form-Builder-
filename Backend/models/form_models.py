"""
Form Models - Pydantic models for form data validation
Note: This is NOT a database model, just Pydantic schemas for API validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


class FormStatus(str, Enum):
    """Form status enumeration"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class FormField(BaseModel):
    """Individual form field schema"""
    id: str
    type: str  # text, email, tel, number, select, checkbox, radio, textarea, file, date, time, url
    label: str
    placeholder: Optional[str] = None
    required: bool = False
    validation: Optional[str] = None
    options: Optional[List[str]] = None
    accept: Optional[List[str]] = None
    min: Optional[int] = None
    max: Optional[int] = None
    visible: Optional[bool] = True
    
    class Config:
        extra = "allow"  # Allow additional fields


class CTAButton(BaseModel):
    """Call-to-Action button configuration"""
    text: str = "Submit"
    backgroundColor: Optional[str] = None
    textColor: Optional[str] = None
    borderRadius: Optional[str] = None
    fontSize: Optional[str] = None
    padding: Optional[str] = None
    
    class Config:
        extra = "allow"


class GlobalStyles(BaseModel):
    """Global form styling configuration"""
    backgroundColor: Optional[str] = None
    textColor: Optional[str] = None
    fontFamily: Optional[str] = None
    
    class Config:
        extra = "allow"


class FormCreate(BaseModel):
    """Schema for creating a new form"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    fields: List[Dict[str, Any]] = Field(default_factory=list)
    globalStyles: Optional[Dict[str, Any]] = None
    ctaButton: Optional[Dict[str, Any]] = None
    status: FormStatus = FormStatus.DRAFT


class FormUpdate(BaseModel):
    """Schema for updating an existing form"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    fields: Optional[List[Dict[str, Any]]] = None
    globalStyles: Optional[Dict[str, Any]] = None
    ctaButton: Optional[Dict[str, Any]] = None
    status: Optional[FormStatus] = None


class FormResponse(BaseModel):
    """Schema for form API responses"""
    id: str
    owner_id: str
    slug: str
    title: str
    description: Optional[str] = None
    fields: List[Dict[str, Any]]
    globalStyles: Optional[Dict[str, Any]] = None
    ctaButton: Optional[Dict[str, Any]] = None
    status: FormStatus
    version: int
    public_url: str
    created_at: str
    updated_at: str
    published_at: Optional[str] = None
    submission_count: int = 0
    
    class Config:
        from_attributes = True


# Alias for backward compatibility
Form = FormResponse
