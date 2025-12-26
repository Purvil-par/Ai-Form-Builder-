"""
JWT Token Handler
Handles JWT token creation, validation, and decoding
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from config import settings
import logging

logger = logging.getLogger(__name__)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    
    Args:
        data: Payload data to encode in token
        expires_delta: Optional custom expiration time
    
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })  
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create JWT refresh token
    
    Args:
        data: Payload data to encode in token
    
    Returns:
        str: Encoded JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> bool:
    """
    Verify if token is valid
    
    Args:
        token: JWT token to verify
        token_type: Expected token type ("access" or "refresh")
    
    Returns:
        bool: True if valid, False otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Check token type
        if payload.get("type") != token_type:
            logger.warning(f"Invalid token type. Expected {token_type}, got {payload.get('type')}")
            return False
        
        return True
        
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        return False


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode JWT token and return payload
    
    Args:
        token: JWT token to decode
    
    Returns:
        Optional[Dict]: Decoded payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
        
    except JWTError as e:
        logger.error(f"JWT decode failed: {e}")
        return None


def get_token_expiry(token: str) -> Optional[datetime]:
    """
    Get token expiration time
    
    Args:
        token: JWT token
    
    Returns:
        Optional[datetime]: Expiration datetime or None
    """
    payload = decode_token(token)
    if payload and "exp" in payload:
        return datetime.fromtimestamp(payload["exp"])
    return None
