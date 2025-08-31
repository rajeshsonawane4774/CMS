"""Add Marathi language columns

Revision ID: add_marathi_columns
Revises: <previous_revision_id>
Create Date: 2025-05-19 21:31:52
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Add Marathi columns to customers table
    op.add_column('customers', sa.Column('name_mr', sa.String(100)))
    op.add_column('customers', sa.Column('address_mr', sa.Text()))
    op.add_column('customers', sa.Column('work_reason_mr', sa.Text()))

def downgrade():
    # Remove Marathi columns if needed
    op.drop_column('customers', 'name_mr')
    op.drop_column('customers', 'address_mr')
    op.drop_column('customers', 'work_reason_mr')