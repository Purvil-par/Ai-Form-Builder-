"""
Configuration Module
Centralized configuration management using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # OpenAI
    OPENAI_API_KEY: str
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017/ai_form_builder"
    MONGODB_DB_NAME: str = "ai_form_builder"
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    
    # Email (Optional)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@aiformbuilder.com"
    
    # Application
    APP_NAME: str = "AI Form Builder"
    FRONTEND_URL: str = "http://localhost:5174"
    BACKEND_URL: str = "http://localhost:8000"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    FORM_SUBMISSION_RATE_LIMIT: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
