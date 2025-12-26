"""
MongoDB Connection Module
Handles database connection, initialization, and lifecycle
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config import settings
import logging

logger = logging.getLogger(__name__)

# Global database client
_client: AsyncIOMotorClient = None
_database: AsyncIOMotorDatabase = None


async def init_database() -> AsyncIOMotorDatabase:
    """
    Initialize MongoDB connection
    
    Returns:
        AsyncIOMotorDatabase: Connected database instance
    
    Raises:
        ConnectionFailure: If unable to connect to MongoDB
    """
    global _client, _database
    
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}")
        
        # Create async MongoDB client
        _client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000,  # 5 second timeout
            maxPoolSize=10,
            minPoolSize=1
        )
        
        # Test connection
        await _client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        
        # Get database
        _database = _client[settings.MONGODB_DB_NAME]
        
        # Create indexes
        await create_indexes()
        
        return _database
        
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise ConnectionFailure(f"Could not connect to MongoDB: {e}")
    except Exception as e:
        logger.error(f"Unexpected error during database initialization: {e}")
        raise


async def create_indexes():
    """Create database indexes for optimal performance"""
    try:
        # Users collection indexes
        await _database.users.create_index("email", unique=True)
        await _database.users.create_index("google_id", sparse=True)
        
        # Forms collection indexes
        await _database.forms.create_index("owner_id")
        await _database.forms.create_index("slug", unique=True)
        await _database.forms.create_index([("owner_id", 1), ("created_at", -1)])
        await _database.forms.create_index("status")
        
        # Submissions collection indexes
        await _database.submissions.create_index("form_id")
        await _database.submissions.create_index([("form_id", 1), ("submitted_at", -1)])
        await _database.submissions.create_index("submitted_at")
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
        # Don't raise - indexes are optimization, not critical


def get_database() -> AsyncIOMotorDatabase:
    """
    Get the current database instance
    
    Returns:
        AsyncIOMotorDatabase: Active database connection
    
    Raises:
        RuntimeError: If database is not initialized
    """
    if _database is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    return _database


async def close_database():
    """Close database connection gracefully"""
    global _client, _database
    
    if _client:
        logger.info("Closing MongoDB connection")
        _client.close()
        _client = None
        _database = None
        logger.info("MongoDB connection closed")


# Health check function
async def check_database_health() -> bool:
    """
    Check if database connection is healthy
    
    Returns:
        bool: True if healthy, False otherwise
    """
    try:
        if _client is None:
            return False
        await _client.admin.command('ping')
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
