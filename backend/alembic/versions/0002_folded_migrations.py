"""folded idempotent DDL (formerly backend/migrations.py)

Revision ID: 0002_folded_migrations
Revises: 0001_baseline
Create Date: 2026-07-07

These statements are additive and idempotent (IF NOT EXISTS / conditional
DO blocks). They keep the incremental schema tweaks reproducible on a fresh
database after the baseline create_all.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_folded_migrations"
down_revision: Union[str, None] = "0001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_STATEMENTS = [
    "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS stolen BOOLEAN DEFAULT false",
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS buyer_last_read_at TIMESTAMPTZ",
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS seller_last_read_at TIMESTAMPTZ",
    "ALTER TABLE listings ADD COLUMN IF NOT EXISTS city VARCHAR(100)",
    "ALTER TABLE listings ADD COLUMN IF NOT EXISTS address VARCHAR(255)",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS seller_confirmed BOOLEAN DEFAULT false",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS buyer_confirmed BOOLEAN DEFAULT false",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason TEXT",
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_admin_chat BOOLEAN DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number VARCHAR(20) NOT NULL DEFAULT ''",
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE tablename = 'users' AND indexname = 'uq_users_id_number'
        ) THEN
            CREATE UNIQUE INDEX uq_users_id_number ON users (id_number)
            WHERE id_number != '';
        END IF;
    END $$;
    """,
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) DEFAULT 'pending'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS id_card_image TEXT",
    "ALTER TABLE conversations ALTER COLUMN listing_id DROP NOT NULL",
    "ALTER TABLE trades ALTER COLUMN listing_id DROP NOT NULL",
    """
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
    """,
    "CREATE INDEX IF NOT EXISTS ix_vehicles_owner_id ON vehicles (owner_id)",
    "CREATE INDEX IF NOT EXISTS ix_listings_frame_number ON listings (frame_number)",
    "CREATE INDEX IF NOT EXISTS ix_listings_seller_id ON listings (seller_id)",
    "CREATE INDEX IF NOT EXISTS ix_trades_listing_id ON trades (listing_id)",
    "CREATE INDEX IF NOT EXISTS ix_trades_buyer_id ON trades (buyer_id)",
    "CREATE INDEX IF NOT EXISTS ix_trades_seller_id ON trades (seller_id)",
    "CREATE INDEX IF NOT EXISTS ix_trades_frame_number ON trades (frame_number)",
    "CREATE INDEX IF NOT EXISTS ix_conversations_listing_id ON conversations (listing_id)",
    "CREATE INDEX IF NOT EXISTS ix_conversations_buyer_id ON conversations (buyer_id)",
    "CREATE INDEX IF NOT EXISTS ix_conversations_seller_id ON conversations (seller_id)",
    "CREATE INDEX IF NOT EXISTS ix_user_interactions_user_id ON user_interactions (user_id)",
    "CREATE INDEX IF NOT EXISTS ix_user_interactions_listing_id ON user_interactions (listing_id)",
    "CREATE INDEX IF NOT EXISTS ix_messages_conversation_id ON messages (conversation_id)",
    "CREATE INDEX IF NOT EXISTS ix_messages_sender_id ON messages (sender_id)",
    "ALTER TABLE trades ALTER COLUMN frame_number DROP NOT NULL",
    """
    DO $$
    DECLARE fk_name TEXT;
    BEGIN
        SELECT constraint_name INTO fk_name
        FROM information_schema.table_constraints
        WHERE table_name = 'trades'
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name LIKE '%frame_number%'
        LIMIT 1;
        IF fk_name IS NOT NULL THEN
            EXECUTE 'ALTER TABLE trades DROP CONSTRAINT ' || fk_name;
            EXECUTE 'ALTER TABLE trades ADD CONSTRAINT trades_frame_number_fkey
                     FOREIGN KEY (frame_number) REFERENCES vehicles(frame_number) ON DELETE SET NULL';
        END IF;
    END $$;
    """,
    "ALTER TABLE listings ALTER COLUMN frame_number DROP NOT NULL",
    """
    DO $$
    DECLARE fk_name TEXT;
    BEGIN
        SELECT constraint_name INTO fk_name
        FROM information_schema.table_constraints
        WHERE table_name = 'listings'
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name LIKE '%frame_number%'
        LIMIT 1;
        IF fk_name IS NOT NULL THEN
            EXECUTE 'ALTER TABLE listings DROP CONSTRAINT ' || fk_name;
            EXECUTE 'ALTER TABLE listings ADD CONSTRAINT listings_frame_number_fkey
                     FOREIGN KEY (frame_number) REFERENCES vehicles(frame_number) ON DELETE SET NULL';
        END IF;
    END $$;
    """,
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS vehicle_frame_number_snapshot VARCHAR(100)",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS vehicle_brand_snapshot VARCHAR(100)",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS vehicle_model_snapshot VARCHAR(100)",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS vehicle_type_snapshot VARCHAR(50)",
    "ALTER TABLE trades ADD COLUMN IF NOT EXISTS vehicle_color_snapshot VARCHAR(50)",
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE tablename = 'listings' AND indexname = 'uq_listings_frame_number'
        ) THEN
            CREATE UNIQUE INDEX uq_listings_frame_number ON listings (frame_number)
            WHERE frame_number IS NOT NULL;
        END IF;
    END $$;
    """,
]


def upgrade() -> None:
    bind = op.get_bind()
    for statement in _STATEMENTS:
        bind.execute(sa.text(statement))


def downgrade() -> None:
    # Additive, idempotent DDL -- intentionally not reversed.
    pass
