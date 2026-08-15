"""cameras table

Revision ID: 7f3c1a9b2e4d
Revises: 4e233fe37812
Create Date: 2026-08-05 15:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '7f3c1a9b2e4d'
down_revision: Union[str, None] = '4e233fe37812'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'cameras',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=False),
        sa.Column('onvif_port', sa.Integer(), nullable=False, server_default='80'),
        sa.Column('rtsp_port', sa.Integer(), nullable=False, server_default='554'),
        sa.Column('username', sa.String(length=255), nullable=False, server_default=''),
        sa.Column('password', sa.String(length=255), nullable=False, server_default=''),
        sa.Column('manufacturer', sa.String(length=255), nullable=True),
        sa.Column('model', sa.String(length=255), nullable=True),
        sa.Column('firmware', sa.String(length=255), nullable=True),
        sa.Column('serial', sa.String(length=255), nullable=True),
        sa.Column('rtsp_path', sa.String(length=255), nullable=True),
        sa.Column('rtsp_source', sa.String(length=16), nullable=False, server_default='none'),
        sa.Column('stream_state', sa.String(length=16), nullable=False, server_default='idle'),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('cameras')
