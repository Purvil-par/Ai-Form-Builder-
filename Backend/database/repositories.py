"""
Database Repositories
Data access layer for MongoDB operations
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from database.connection import get_database
from models.user import User, UserCreate
from models.form_models import FormCreate, FormUpdate
from models.submission import Submission, SubmissionCreate
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class UserRepository:
    """Repository for User operations"""
    
    def __init__(self):
        self.db: AsyncIOMotorDatabase = get_database()
        self.collection = self.db.users
    
    async def create(self, user_data: UserCreate, hashed_password: str) -> Dict[str, Any]:
        """Create a new user"""
        user_dict = {
            "email": user_data.email,
            "full_name": user_data.full_name,
            "avatar_url": user_data.avatar_url,
            "hashed_password": hashed_password,
            "is_active": True,
            "is_verified": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await self.collection.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        return user_dict
    
    async def create_from_google(self, google_info: Dict[str, Any]) -> Dict[str, Any]:
        """Create user from Google OAuth"""
        user_dict = {
            "email": google_info["email"],
            "full_name": google_info.get("name"),
            "avatar_url": google_info.get("picture"),
            "google_id": google_info["google_id"],
            "is_active": True,
            "is_verified": google_info.get("email_verified", False),
            "email_verified_at": datetime.utcnow() if google_info.get("email_verified") else None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await self.collection.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        return user_dict
    
    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        return await self.collection.find_one({"email": email})
    
    async def get_by_google_id(self, google_id: str) -> Optional[Dict[str, Any]]:
        """Get user by Google ID"""
        return await self.collection.find_one({"google_id": google_id})
    
    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            return await self.collection.find_one({"_id": ObjectId(user_id)})
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    async def update(self, user_id: str, update_data: Dict[str, Any]) -> bool:
        """Update user"""
        update_data["updated_at"] = datetime.utcnow()
        result = await self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def update_last_login(self, user_id: str) -> bool:
        """Update last login timestamp"""
        result = await self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        return result.modified_count > 0


class FormRepository:
    """Repository for Form operations"""
    
    def __init__(self):
        self.db: AsyncIOMotorDatabase = get_database()
        self.collection = self.db.forms
    
    async def create(self, form_data: FormCreate, owner_id: str, slug: str) -> Dict[str, Any]:
        """Create a new form"""
        form_dict = form_data.model_dump()
        form_dict.update({
            "owner_id": owner_id,
            "slug": slug,
            "version": 1,
            "version_history": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "submission_count": 0
        })
        
        result = await self.collection.insert_one(form_dict)
        form_dict["_id"] = result.inserted_id
        return form_dict
    
    async def get_by_id(self, form_id: str) -> Optional[Dict[str, Any]]:
        """Get form by ID"""
        try:
            return await self.collection.find_one({"_id": ObjectId(form_id)})
        except Exception as e:
            logger.error(f"Error getting form by ID: {e}")
            return None
    
    async def get_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """Get form by slug"""
        return await self.collection.find_one({"slug": slug})
    
    async def get_user_forms(self, owner_id: str, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all forms owned by a user"""
        cursor = self.collection.find({"owner_id": owner_id}).sort("created_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)
    
    async def update(self, form_id: str, update_data: FormUpdate, owner_id: str) -> bool:
        """Update form (owner only)"""
        # Get raw dict including None values for fields that were explicitly set
        raw_dict = update_data.model_dump(exclude_unset=True)
        
        # Fields that can be explicitly set to null (removed)
        nullable_fields = {'backgroundImage', 'editorContent', 'ctaButton'}
        
        # Build update dict - keep None for nullable fields, filter for others
        update_dict = {}
        unset_dict = {}
        
        for k, v in raw_dict.items():
            if v is None and k in nullable_fields:
                # Explicitly remove these fields from the document
                unset_dict[k] = ""
            elif v is not None:
                update_dict[k] = v
        
        update_dict["updated_at"] = datetime.utcnow()
        
        # Build MongoDB update operation
        update_ops = {"$set": update_dict}
        if unset_dict:
            update_ops["$unset"] = unset_dict
        
        result = await self.collection.update_one(
            {"_id": ObjectId(form_id), "owner_id": owner_id},
            update_ops
        )
        return result.modified_count > 0
    
    async def delete(self, form_id: str, owner_id: str) -> bool:
        """Delete form (owner only)"""
        result = await self.collection.delete_one({"_id": ObjectId(form_id), "owner_id": owner_id})
        return result.deleted_count > 0
    
    async def archive(self, form_id: str, owner_id: str) -> bool:
        """Archive form (soft delete)"""
        result = await self.collection.update_one(
            {"_id": ObjectId(form_id), "owner_id": owner_id},
            {"$set": {"status": "archived", "archived_at": datetime.utcnow()}}
        )
        return result.modified_count > 0
    
    async def increment_submission_count(self, form_id: str) -> bool:
        """Increment submission count"""
        result = await self.collection.update_one(
            {"_id": ObjectId(form_id)},
            {"$inc": {"submission_count": 1}}
        )
        return result.modified_count > 0
    
    async def slug_exists(self, slug: str) -> bool:
        """Check if slug already exists"""
        count = await self.collection.count_documents({"slug": slug})
        return count > 0


class SubmissionRepository:
    """Repository for Submission operations"""
    
    def __init__(self):
        self.db: AsyncIOMotorDatabase = get_database()
        self.collection = self.db.submissions
    
    async def create(self, submission_data: SubmissionCreate, form_id: str, ip_address: str = None, user_agent: str = None, session_id: str = None) -> Dict[str, Any]:
        """Create a new submission"""
        submission_dict = {
            "form_id": form_id,
            "form_data": submission_data.form_data,
            "metadata": submission_data.metadata,
            "submitted_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "ip_address": ip_address,
            "user_agent": user_agent,
            "session_id": session_id  # For tracking returning users
        }
        
        result = await self.collection.insert_one(submission_dict)
        submission_dict["_id"] = result.inserted_id
        return submission_dict
    
    async def get_by_id(self, submission_id: str) -> Optional[Dict[str, Any]]:
        """Get submission by ID"""
        try:
            return await self.collection.find_one({"_id": ObjectId(submission_id)})
        except Exception as e:
            logger.error(f"Error getting submission by ID: {e}")
            return None
    
    async def get_by_session(self, form_id: str, session_id: str) -> Optional[Dict[str, Any]]:
        """Get submission by form ID and session ID (for prefill)"""
        try:
            return await self.collection.find_one({
                "form_id": form_id,
                "session_id": session_id
            })
        except Exception as e:
            logger.error(f"Error getting submission by session: {e}")
            return None
    
    async def update_by_session(self, form_id: str, session_id: str, form_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update existing submission by session ID"""
        try:
            result = await self.collection.find_one_and_update(
                {"form_id": form_id, "session_id": session_id},
                {
                    "$set": {
                        "form_data": form_data,
                        "updated_at": datetime.utcnow()
                    }
                },
                return_document=True
            )
            return result
        except Exception as e:
            logger.error(f"Error updating submission by session: {e}")
            return None
    
    async def get_form_submissions(self, form_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all submissions for a form"""
        cursor = self.collection.find({"form_id": form_id}).sort("submitted_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)
    
    async def count_form_submissions(self, form_id: str) -> int:
        """Count submissions for a form"""
        return await self.collection.count_documents({"form_id": form_id})
    
    async def delete(self, submission_id: str) -> bool:
        """Delete submission"""
        result = await self.collection.delete_one({"_id": ObjectId(submission_id)})
        return result.deleted_count > 0

