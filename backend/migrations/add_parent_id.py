from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('customers', sa.Column('parent_id', sa.Integer, sa.ForeignKey('customers.id')))

def downgrade():
    op.drop_column('customers', 'parent_id')