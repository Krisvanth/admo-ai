"""
Admo AI - Database Module

Handles PostgreSQL connection using async SQLAlchemy.
Configuration is loaded from config.py (environment variables).
"""

from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from config import settings

# Create async engine with settings from config
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Only log SQL in debug mode
    future=True,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=5,  # Connection pool size
    max_overflow=10  # Max overflow connections
)


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        # await conn.run_sync(SQLModel.metadata.drop_all)  # For development only
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncSession:
    """
    Dependency to get async database session.
    
    Usage in FastAPI:
        async def my_endpoint(session: AsyncSession = Depends(get_session)):
            ...
    """
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
