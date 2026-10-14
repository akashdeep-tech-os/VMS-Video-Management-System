"""add rtsp_mobile_path to cameras for e-Vision subtype=2 mobile streams

Revision ID: c9e8d7a6b5f4
Revises: b7e8f9a0c1d2
Create Date: 2026-10-14 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c9e8d7a6b5f4'
down_revision: Union[str, None] = 'b7e8f9a0c1d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('cameras', sa.Column('rtsp_mobile_path', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('cameras', 'rtsp_mobile_path')
