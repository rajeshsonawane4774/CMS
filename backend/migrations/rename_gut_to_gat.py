"""rename gut_number to gat_number

Revision ID: rename_gut_to_gat
Revises: add_new_columns
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'rename_gut_to_gat'
down_revision = 'add_new_columns'
branch_labels = None
depends_on = None

def upgrade():
    # Rename gut_number to gat_number
    op.alter_column('customers', 'gut_number', new_column_name='gat_number')

def downgrade():
    # Rename gat_number back to gut_number
    op.alter_column('customers', 'gat_number', new_column_name='gut_number') 