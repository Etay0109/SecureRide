from sqlalchemy import text


async def run_migrations(engine):
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
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number VARCHAR(20) NOT NULL DEFAULT ''"
        ))
        await conn.execute(text("""
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
        """))
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) DEFAULT 'pending'"
        ))
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS id_card_image TEXT"
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

        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_vehicles_owner_id ON vehicles (owner_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_listings_frame_number ON listings (frame_number)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_listings_seller_id ON listings (seller_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_trades_listing_id ON trades (listing_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_trades_buyer_id ON trades (buyer_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_trades_seller_id ON trades (seller_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_trades_frame_number ON trades (frame_number)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_conversations_listing_id ON conversations (listing_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_conversations_buyer_id ON conversations (buyer_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_conversations_seller_id ON conversations (seller_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_user_interactions_user_id ON user_interactions (user_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_user_interactions_listing_id ON user_interactions (listing_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_messages_conversation_id ON messages (conversation_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_messages_sender_id ON messages (sender_id)"
        ))
