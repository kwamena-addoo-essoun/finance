"""Add email verification, password reset, plaid tables

Revision ID: 002
Revises: 001
Create Date: 2026-02-28
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- Users: new columns ---
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false()))
        batch_op.add_column(sa.Column("email_verification_token", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("email_verification_token_expires", sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column("password_reset_token", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("password_reset_token_expires", sa.DateTime(), nullable=True))

    # --- plaid_items ---
    op.create_table(
        "plaid_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("item_id", sa.String(), unique=True, nullable=False),
        sa.Column("access_token", sa.String(), nullable=False),
        sa.Column("institution_id", sa.String(), nullable=True),
        sa.Column("institution_name", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_plaid_items_user_id", "plaid_items", ["user_id"])
    op.create_index("ix_plaid_items_item_id", "plaid_items", ["item_id"], unique=True)

    # --- bank_accounts ---
    op.create_table(
        "bank_accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("plaid_item_id", sa.Integer(), sa.ForeignKey("plaid_items.id"), nullable=False),
        sa.Column("account_id", sa.String(), unique=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("official_name", sa.String(), nullable=True),
        sa.Column("type", sa.String(), nullable=True),
        sa.Column("subtype", sa.String(), nullable=True),
        sa.Column("mask", sa.String(4), nullable=True),
        sa.Column("current_balance", sa.Float(), nullable=True),
        sa.Column("available_balance", sa.Float(), nullable=True),
        sa.Column("currency_code", sa.String(3), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_bank_accounts_plaid_item_id", "bank_accounts", ["plaid_item_id"])
    op.create_index("ix_bank_accounts_account_id", "bank_accounts", ["account_id"], unique=True)


def downgrade() -> None:
    op.drop_table("bank_accounts")
    op.drop_table("plaid_items")
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("password_reset_token_expires")
        batch_op.drop_column("password_reset_token")
        batch_op.drop_column("email_verification_token_expires")
        batch_op.drop_column("email_verification_token")
        batch_op.drop_column("is_verified")
