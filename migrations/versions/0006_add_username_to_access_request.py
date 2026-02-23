"""add username to access request

Revision ID: 0006_add_username_to_access_request
Revises: 0005_add_activity_log
Create Date: 2024-06-01 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0006_add_username_to_access_request"
down_revision = "0005_add_activity_log"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "access_request",
        sa.Column(
            "username",
            sa.String(length=80),
            nullable=False,
            server_default="",
        ),
    )
    op.alter_column(
        "access_request",
        "username",
        server_default=None,
    )


def downgrade():
    op.drop_column("access_request", "username")
