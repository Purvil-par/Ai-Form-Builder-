"""Routes package initialization"""

from .auth_routes import router as auth_router
from .form_routes import router as form_router
from .submission_routes import router as submission_router

__all__ = ["auth_router", "form_router", "submission_router"]
