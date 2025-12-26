"""
Password Hashing and Verification
Uses bcrypt directly for secure password hashing
"""

import bcrypt
import logging
import hashlib

logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt
    
    Args:
        password: Plain text password
    
    Returns:
        str: Hashed password
    """
    try:
        # Convert password to bytes
        password_bytes = password.encode('utf-8')
        
        # Bcrypt has a 72-byte limit, so we pre-hash long passwords with SHA256
        if len(password_bytes) > 72:
            # Use SHA256 to reduce password to fixed length
            password_bytes = hashlib.sha256(password_bytes).hexdigest().encode('utf-8')
        
        # Generate salt and hash password
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password_bytes, salt)
        
        # Return as string
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        raise ValueError(f"Failed to hash password: {str(e)}")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to compare against
    
    Returns:
        bool: True if password matches, False otherwise
    """
    try:
        # Convert to bytes
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        # Apply same pre-hashing if password is too long
        if len(password_bytes) > 72:
            password_bytes = hashlib.sha256(password_bytes).hexdigest().encode('utf-8')
        
        # Verify password
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


def needs_rehash(hashed_password: str, rounds: int = 12) -> bool:
    """
    Check if password hash needs to be updated
    (Simple implementation - always returns False for now)
    
    Args:
        hashed_password: Current password hash
        rounds: Desired number of rounds
    
    Returns:
        bool: True if rehash needed
    """
    # For now, we don't check if rehash is needed
    # You can implement this by checking the rounds in the hash
    return False
