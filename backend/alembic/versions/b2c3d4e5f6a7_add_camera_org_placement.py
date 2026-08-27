"""add camera org placement columns

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-27 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('cameras', sa.Column('station_id', sa.Integer(), nullable=True))
    op.add_column('cameras', sa.Column('station_name', sa.String(length=255), nullable=True))
    op.add_column('cameras', sa.Column('site_id', sa.Integer(), nullable=True))
    op.add_column('cameras', sa.Column('site_name', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('cameras', 'site_name')
    op.drop_column('cameras', 'site_id')
    op.drop_column('cameras', 'station_name')
    op.drop_column('cameras', 'station_id')
