"""add rtsp_sub_path to cameras for sub/main stream switching

Revision ID: a1b2c3d4e5f7
Revises: f6a7b8c9d0e1
Create Date: 2026-09-03 14:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f7'
down_revision: Union[str, None] = ('f6a7b8c9d0e1', 'a7b8c9d0e1f2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('cameras', sa.Column('rtsp_sub_path', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('cameras', 'rtsp_sub_path')
