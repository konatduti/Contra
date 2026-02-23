"""add activity log table

Revision ID: 0005_add_activity_log
Revises: 0004_remove_recommendations
Create Date: 2024-05-16 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0005_add_activity_log"
down_revision = "0004_remove_recommendations"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "activity_log",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=20), nullable=False),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("company_id", sa.Integer(), nullable=True),
        sa.Column("document_id", sa.Integer(), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("location_label", sa.String(length=255), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("analysis_status", sa.String(length=50), nullable=True),
        sa.Column("shared_with_contra", sa.Boolean(), nullable=True),
        sa.Column("credit_type", sa.String(length=50), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"], ),
        sa.ForeignKeyConstraint(["document_id"], ["document.id"], ),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_activity_log_occurred_at"),
        "activity_log",
        ["occurred_at"],
        unique=False,
    )
    op.create_index(
        "ix_activity_log_event_type",
        "activity_log",
        ["event_type"],
        unique=False,
    )
    op.create_index(
        "ix_activity_log_user_event_occurred",
        "activity_log",
        ["user_id", "event_type", "occurred_at"],
        unique=False,
    )
    op.create_index(
        "ix_activity_log_company_event_occurred",
        "activity_log",
        ["company_id", "event_type", "occurred_at"],
        unique=False,
    )


def downgrade():
    op.drop_index(
        "ix_activity_log_company_event_occurred", table_name="activity_log"
    )
    op.drop_index("ix_activity_log_user_event_occurred", table_name="activity_log")
    op.drop_index("ix_activity_log_event_type", table_name="activity_log")
    op.drop_index(op.f("ix_activity_log_occurred_at"), table_name="activity_log")
    op.drop_table("activity_log")
