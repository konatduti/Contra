"""Add language preference to users"""
from alembic import op
import sqlalchemy as sa


revision = "0002_add_user_language"
down_revision = "0001_add_pii_map"
branch_labels = None
depends_on = None


LANGUAGE_CHECK_NAME = "user_language_check"


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column("language", sa.String(length=2), nullable=False, server_default="en"),
    )
    op.create_check_constraint(
        LANGUAGE_CHECK_NAME,
        "user",
        "language IN ('en','hu')",
    )
    op.alter_column("user", "language", server_default=None)


def downgrade() -> None:
    op.drop_constraint(LANGUAGE_CHECK_NAME, "user", type_="check")
    op.drop_column("user", "language")
