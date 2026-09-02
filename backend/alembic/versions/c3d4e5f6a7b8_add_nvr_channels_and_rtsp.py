"""add nvr channels and rtsp columns

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-08-27 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('nvrs', sa.Column('no_of_channels', sa.Integer(), nullable=True))
    op.add_column('nvrs', sa.Column('brand_name', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('nvrs', 'brand_name')
    op.drop_column('nvrs', 'no_of_channels')
