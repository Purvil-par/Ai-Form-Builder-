"""
Submission Model
Defines form submission schema
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId


class SubmissionCreate(BaseModel):
    """Model for creating a form submission"""
    form_data: Dict[str, Any]  # Field ID -> Value mapping
    metadata: Optional[Dict[str, Any]] = None


class SubmissionResponse(BaseModel):
    """Model for submission response"""
    id: str = Field(alias="_id")
    form_id: str
    form_data: Dict[str, Any]
    submitted_at: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class Submission(BaseModel):
    """Complete submission model for database storage"""
    id: Optional[ObjectId] = Field(default=None, alias="_id")
    form_id: str  # Reference to form
    form_data: Dict[str, Any]  # Submitted data
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None  # Additional metadata
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
