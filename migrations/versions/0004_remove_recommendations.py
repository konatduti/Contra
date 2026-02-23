"""Remove recommendations fields from analysis"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0004_remove_recommendations'
down_revision = '0003_add_multi_length_summaries'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column['name'] for column in inspector.get_columns('analysis')}

    with op.batch_alter_table('analysis', schema=None) as batch_op:
        if 'encrypted_recommendations' in columns:
            batch_op.drop_column('encrypted_recommendations')
        if 'recommendations' in columns:
            batch_op.drop_column('recommendations')


def downgrade():
    with op.batch_alter_table('analysis', schema=None) as batch_op:
        batch_op.add_column(sa.Column('recommendations', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('encrypted_recommendations', sa.Text(), nullable=True))
