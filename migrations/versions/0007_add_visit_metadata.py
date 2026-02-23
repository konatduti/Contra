"""
Add visit metadata columns to activity log.

Revision ID: 0007_add_visit_metadata
Revises: 0006_add_username_to_access_request
Create Date: 2024-06-05 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0007_add_visit_metadata"
down_revision = "0006_add_username_to_access_request"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("activity_log") as batch_op:
        batch_op.add_column(sa.Column("country", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("city", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("visit_type", sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column("user_agent", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("path", sa.String(length=512), nullable=True))


def downgrade():
    with op.batch_alter_table("activity_log") as batch_op:
        batch_op.drop_column("path")
        batch_op.drop_column("user_agent")
        batch_op.drop_column("visit_type")
        batch_op.drop_column("city")
        batch_op.drop_column("country")
