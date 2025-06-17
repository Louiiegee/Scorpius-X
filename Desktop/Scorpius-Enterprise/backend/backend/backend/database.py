"""
Async database setup for Time Machine backend
"""
import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import logging

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./time_machine.db")

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("DEBUG", "false").lower() == "true",
    pool_pre_ping=True
)

# Create session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


# Legacy declarative base for older SQLAlchemy
Base = declarative_base()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Get async database session for dependency injection
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """
    Create all database tables
    """
    try:
        from models.replay_models import Base as ReplayBase
        from models.time_machine_models import TimeEvent  # Import to ensure models are registered
        
        async with engine.begin() as conn:
            await conn.run_sync(ReplayBase.metadata.create_all)
        
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise


async def close_db():
    """
    Close database connections
    """
    await engine.dispose()
    logger.info("Database connections closed")


# Health check function
async def check_db_health() -> bool:
    """
    Check if database is accessible
    """
    try:
        async with AsyncSessionLocal() as session:
            await session.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
