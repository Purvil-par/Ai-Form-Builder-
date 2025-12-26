"""
Google OAuth Handler
Handles Google OAuth 2.0 authentication flow
"""

from google.oauth2 import id_token
from google.auth.transport import requests
from config import settings
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


async def verify_google_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify Google ID token and extract user information
    
    Args:
        token: Google ID token from frontend
    
    Returns:
        Optional[Dict]: User info if valid, None otherwise
    """
    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        
        # Verify issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            logger.warning(f"Invalid token issuer: {idinfo['iss']}")
            return None
            
        # Extract user information
        user_info = {
            "google_id": idinfo['sub'],
            "email": idinfo['email'],
            "email_verified": idinfo.get('email_verified', False),
            "name": idinfo.get('name'),
            "picture": idinfo.get('picture'),
            "given_name": idinfo.get('given_name'),
            "family_name": idinfo.get('family_name')
        }
        
        logger.info(f"Successfully verified Google token for user: {user_info['email']}")
        return user_info
        
    except ValueError as e:
        logger.error(f"Invalid Google token: {e}")
        return None
    except Exception as e:
        logger.error(f"Error verifying Google token: {e}")
        return None


def get_google_oauth_url() -> str:
    """
    Generate Google OAuth authorization URL
    
    Returns:
        str: Authorization URL for redirecting user
    """
    from urllib.parse import urlencode
    
    params = {
        'client_id': settings.GOOGLE_CLIENT_ID,
        'redirect_uri': settings.GOOGLE_REDIRECT_URI,
        'response_type': 'code',
        'scope': 'openid email profile',
        'access_type': 'offline',
        'prompt': 'consent'
    }
    
    base_url = 'https://accounts.google.com/o/oauth2/v2/auth'
    return f"{base_url}?{urlencode(params)}"
