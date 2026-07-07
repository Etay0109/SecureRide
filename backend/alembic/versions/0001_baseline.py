"""baseline schema (all tables from the ORM models)

Revision ID: 0001_baseline
Revises:
Create Date: 2026-07-07

This mirrors what the former database.create_tables() did via
Base.metadata.create_all. On an existing, already-populated database this
revision is never executed -- run `alembic stamp head` once instead.
"""
from typing import Sequence, Union

from alembic import op

from database import Base
import models  # noqa: F401  (registers every table on Base.metadata)

revision: str = "0001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind)
