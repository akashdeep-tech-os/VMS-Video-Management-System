"""add unique constraint on nvrs (ip_address, port, rtsp_port)

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-09-03 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('nvrs') as batch_op:
        batch_op.create_unique_constraint(
            'uq_nvr_address_port', ['ip_address', 'port', 'rtsp_port'],
        )


def downgrade() -> None:
    with op.batch_alter_table('nvrs') as batch_op:
        batch_op.drop_constraint('uq_nvr_address_port', type_='unique')
