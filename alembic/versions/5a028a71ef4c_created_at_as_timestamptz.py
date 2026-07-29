"""created_at as timestamptz

Revision ID: 5a028a71ef4c
Revises: 7dabaa3bcc7c
Create Date: 2026-07-29 18:45:37.529108

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a028a71ef4c'
down_revision: Union[str, Sequence[str], None] = '7dabaa3bcc7c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Store created_at as an absolute instant instead of a naive wall clock.

    The USING clause is load-bearing. Without it Postgres interprets the
    existing naive values as being in the *session's* TimeZone, which would
    silently shift every historical row by that offset. All rows to date were
    written by a server running Etc/UTC, so we state that explicitly and the
    result is identical no matter where the migration is run from.
    """
    op.alter_column(
        "message",
        "created_at",
        existing_type=sa.DateTime(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False,
        existing_server_default=sa.text("now()"),
        postgresql_using="created_at AT TIME ZONE 'UTC'",
    )


def downgrade() -> None:
    """Downgrade schema.

    `AT TIME ZONE 'UTC'` is its own inverse here: applied to a timestamptz it
    renders the instant as a naive UTC wall clock, which is exactly the
    representation this column held before the upgrade.
    """
    op.alter_column(
        "message",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(),
        existing_nullable=False,
        existing_server_default=sa.text("now()"),
        postgresql_using="created_at AT TIME ZONE 'UTC'",
    )
