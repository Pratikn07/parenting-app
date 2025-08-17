from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
import redis.asyncio as aioredis
from config.settings import settings

# Database setup
engine = create_async_engine(
    settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.debug
)

async_session = async_sessionmaker(
    engine,
    expire_on_commit=False
)

Base = declarative_base()

# Redis setup
redis_client = aioredis.from_url(settings.redis_url)

# Dependency to get database session
async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

# Dependency to get redis client
async def get_redis():
    return redis_client
