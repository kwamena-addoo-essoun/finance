"""Add ai_data_consent to users

Revision ID: 004
Revises: 003
Create Date: 2026-03-01
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "e992429d39eb"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column(
                "ai_data_consent",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("ai_data_consent")
