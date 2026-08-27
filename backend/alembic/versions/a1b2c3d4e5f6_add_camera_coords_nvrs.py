"""add camera coordinates and nvrs table

Revision ID: a1b2c3d4e5f6
Revises: 7f3c1a9b2e4d
Create Date: 2026-08-27 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '7f3c1a9b2e4d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add latitude/longitude to cameras table
    op.add_column('cameras', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('cameras', sa.Column('longitude', sa.Float(), nullable=True))

    # Create nvrs table
    op.create_table(
        'nvrs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=False),
        sa.Column('port', sa.Integer(), nullable=False, server_default='80'),
        sa.Column('username', sa.String(length=255), nullable=False, server_default=''),
        sa.Column('password', sa.String(length=255), nullable=False, server_default=''),
        sa.Column('manufacturer', sa.String(length=255), nullable=True),
        sa.Column('model', sa.String(length=255), nullable=True),
        sa.Column('firmware', sa.String(length=255), nullable=True),
        sa.Column('serial', sa.String(length=255), nullable=True),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('nvrs')
    op.drop_column('cameras', 'longitude')
    op.drop_column('cameras', 'latitude')
