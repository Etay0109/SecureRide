import os
import ssl

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")

clean_url = DATABASE_URL.replace("?sslmode=require", "").replace("&sslmode=require", "")
ssl_context = ssl.create_default_context()

engine = create_async_engine(clean_url, echo=False, connect_args={"ssl": ssl_context})

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass

# Provide a database session for each request.
async def get_db():
    async with async_session() as session:
        yield session


# Create database tables and run pending migrations.
async def create_tables():
    async with engine.begin() as conn:
        from models import User, Vehicle, Listing, Conversation, Message, Trade, UserInteraction  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)

    from migrations import run_migrations
    await run_migrations(engine)