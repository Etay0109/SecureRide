"""conversation kind + participant columns

Revision ID: 0003_conversation_participants
Revises: 0002_folded_migrations
Create Date: 2026-07-07
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0003_conversation_participants"
down_revision: Union[str, None] = "0002_folded_migrations"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_STATEMENTS = [
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS kind VARCHAR(20) DEFAULT 'listing'",
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participant_a_id VARCHAR(36)",
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participant_b_id VARCHAR(36)",
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participant_a_last_read_at TIMESTAMPTZ",
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participant_b_last_read_at TIMESTAMPTZ",
    "UPDATE conversations SET participant_a_id = buyer_id WHERE participant_a_id IS NULL",
    "UPDATE conversations SET participant_b_id = seller_id WHERE participant_b_id IS NULL",
    "UPDATE conversations SET kind = 'admin' WHERE is_admin_chat = true",
    "UPDATE conversations SET participant_a_last_read_at = buyer_last_read_at WHERE participant_a_last_read_at IS NULL",
    "UPDATE conversations SET participant_b_last_read_at = seller_last_read_at WHERE participant_b_last_read_at IS NULL",
]


def upgrade() -> None:
    for stmt in _STATEMENTS:
        op.execute(stmt)


def downgrade() -> None:
    pass
