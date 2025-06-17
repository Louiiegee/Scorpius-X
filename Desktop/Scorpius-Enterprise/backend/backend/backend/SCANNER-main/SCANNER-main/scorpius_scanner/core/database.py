import asyncio
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, JSON, DateTime, Text, Integer
from datetime import datetime
from .config import settings
from .logging import get_logger

logger = get_logger(__name__)

class Base(DeclarativeBase):
    pass

class ScanResult(Base):
    __tablename__ = "scan_results"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scan_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    target: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50))
    findings: Mapped[Dict[str, Any]] = mapped_column(JSON)
    metadata: Mapped[Dict[str, Any]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

# Database connection
engine = create_async_engine(
    settings.database.url,
    pool_size=settings.database.pool_size,
    max_overflow=settings.database.max_overflow,
    echo=settings.debug
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized")

async def get_db_session() -> AsyncSession:
    """Get async database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
