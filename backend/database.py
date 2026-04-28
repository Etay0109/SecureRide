import os
import ssl

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")

# asyncpg doesn't understand sslmode=require — strip it and pass ssl=True via connect_args
clean_url = DATABASE_URL.replace("?sslmode=require", "").replace("&sslmode=require", "")
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

engine = create_async_engine(clean_url, echo=False, connect_args={"ssl": ssl_context})

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        yield session


async def create_tables():
    async with engine.begin() as conn:
        from models import User, Vehicle, Listing, Conversation, Message, Trade  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)

    from sqlalchemy import text
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS stolen BOOLEAN DEFAULT false"
        ))
        await conn.execute(text(
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS buyer_last_read_at TIMESTAMPTZ"
        ))
        await conn.execute(text(
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS seller_last_read_at TIMESTAMPTZ"
        ))
        await conn.execute(text(
            "ALTER TABLE listings ADD COLUMN IF NOT EXISTS city VARCHAR(100)"
        ))
        await conn.execute(text(
            "ALTER TABLE listings ADD COLUMN IF NOT EXISTS address VARCHAR(255)"
        ))
        await conn.execute(text(
            "ALTER TABLE trades ADD COLUMN IF NOT EXISTS seller_confirmed BOOLEAN DEFAULT false"
        ))
        await conn.execute(text(
            "ALTER TABLE trades ADD COLUMN IF NOT EXISTS buyer_confirmed BOOLEAN DEFAULT false"
        ))
        await conn.execute(text(
            "ALTER TABLE trades ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ"
        ))
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false"
        ))
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false"
        ))
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason TEXT"
        ))
        await conn.execute(text(
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_admin_chat BOOLEAN DEFAULT false"
        ))
        await conn.execute(text(
            "ALTER TABLE conversations ALTER COLUMN listing_id DROP NOT NULL"
        ))
        await conn.execute(text(
            "ALTER TABLE trades ALTER COLUMN listing_id DROP NOT NULL"
        ))
        # Recreate FK with ON DELETE SET NULL if the old one is restrictive
        await conn.execute(text("""
            DO $$
            DECLARE fk_name TEXT;
            BEGIN
                SELECT constraint_name INTO fk_name
                FROM information_schema.table_constraints
                WHERE table_name = 'trades'
                  AND constraint_type = 'FOREIGN KEY'
                  AND constraint_name LIKE '%listing_id%'
                LIMIT 1;
                IF fk_name IS NOT NULL THEN
                    EXECUTE 'ALTER TABLE trades DROP CONSTRAINT ' || fk_name;
                    EXECUTE 'ALTER TABLE trades ADD CONSTRAINT trades_listing_id_fkey
                             FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL';
                END IF;
            END $$;
        """))
