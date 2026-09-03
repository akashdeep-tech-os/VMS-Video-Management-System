"""drop station_id, station_name, site_id, site_name from cameras

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-09-03 13:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('cameras', 'station_id')
    op.drop_column('cameras', 'station_name')
    op.drop_column('cameras', 'site_id')
    op.drop_column('cameras', 'site_name')


def downgrade() -> None:
    op.add_column('cameras', sa.Column('station_id', sa.Integer(), nullable=True))
    op.add_column('cameras', sa.Column('station_name', sa.String(255), nullable=True))
    op.add_column('cameras', sa.Column('site_id', sa.Integer(), nullable=True))
    op.add_column('cameras', sa.Column('site_name', sa.String(255), nullable=True))
