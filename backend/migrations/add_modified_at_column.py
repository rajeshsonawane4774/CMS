"""add modified_at column

Revision ID: add_modified_at_column
Revises: add_document_number
Create Date: 2025-08-24 20:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from db import db

# revision identifiers, used by Alembic.
revision = 'add_modified_at_column'
down_revision = 'add_document_number'
branch_labels = None
depends_on = None

def upgrade():
    db.engine.execute('ALTER TABLE customer ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP')
    db.engine.execute('ALTER TABLE customer ADD COLUMN modified_at DATETIME DEFAULT CURRENT_TIMESTAMP')

def downgrade():
    db.engine.execute('ALTER TABLE customer DROP COLUMN created_at')
    db.engine.execute('ALTER TABLE customer DROP COLUMN modified_at')