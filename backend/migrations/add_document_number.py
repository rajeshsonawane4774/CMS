"""add document_number column

Revision ID: add_document_number
Revises: rename_gut_to_gat
Create Date: 2024-12-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_document_number'
down_revision = 'rename_gut_to_gat'
branch_labels = None
depends_on = None

def upgrade():
    # Add document_number column
    op.add_column('customers', sa.Column('document_number', sa.String(50), nullable=True))

def downgrade():
    # Remove document_number column
    op.drop_column('customers', 'document_number') 