"""Add pii_map column to Analysis"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0001_add_pii_map"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("analysis", sa.Column("pii_map", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("analysis", "pii_map")
