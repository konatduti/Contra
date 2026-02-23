"""add multi length summary fields

Revision ID: 0003_add_multi_length_summaries
Revises: 0002_add_user_language
Create Date: 2024-07-05 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0003_add_multi_length_summaries'
down_revision = '0002_add_user_language'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('analysis', schema=None) as batch_op:
        batch_op.add_column(sa.Column('summary_detailed_en', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('summary_normal_en', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('summary_short_en', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('summary_detailed_hu', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('summary_normal_hu', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('summary_short_hu', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('encrypted_summary_detailed_en', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('encrypted_summary_normal_en', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('encrypted_summary_short_en', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('encrypted_summary_detailed_hu', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('encrypted_summary_normal_hu', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('encrypted_summary_short_hu', sa.Text(), nullable=True))


def downgrade():
    with op.batch_alter_table('analysis', schema=None) as batch_op:
        batch_op.drop_column('encrypted_summary_short_hu')
        batch_op.drop_column('encrypted_summary_normal_hu')
        batch_op.drop_column('encrypted_summary_detailed_hu')
        batch_op.drop_column('encrypted_summary_short_en')
        batch_op.drop_column('encrypted_summary_normal_en')
        batch_op.drop_column('encrypted_summary_detailed_en')
        batch_op.drop_column('summary_short_hu')
        batch_op.drop_column('summary_normal_hu')
        batch_op.drop_column('summary_detailed_hu')
        batch_op.drop_column('summary_short_en')
        batch_op.drop_column('summary_normal_en')
        batch_op.drop_column('summary_detailed_en')
