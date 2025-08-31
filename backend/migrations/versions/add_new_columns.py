"""add new columns and rename address

Revision ID: add_new_columns
Revises: add_marathi_columns
Create Date: 2024-03-19

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_new_columns'
down_revision = 'add_marathi_columns'
branch_labels = None
depends_on = None

def upgrade():
    # Rename address columns to village
    op.alter_column('customers', 'address', new_column_name='village')
    op.alter_column('customers', 'address_mr', new_column_name='village_mr')
    
    # Add new columns
    op.add_column('customers', sa.Column('cts_number', sa.String(50), nullable=True))
    op.add_column('customers', sa.Column('plot_number', sa.String(50), nullable=True))
    op.add_column('customers', sa.Column('gut_number', sa.String(50), nullable=True))
    op.add_column('customers', sa.Column('submitted_by', sa.String(100), nullable=True))

def downgrade():
    # Remove new columns
    op.drop_column('customers', 'submitted_by')
    op.drop_column('customers', 'gut_number')
    op.drop_column('customers', 'plot_number')
    op.drop_column('customers', 'cts_number')
    
    # Rename village columns back to address
    op.alter_column('customers', 'village', new_column_name='address')
    op.alter_column('customers', 'village_mr', new_column_name='address_mr') 