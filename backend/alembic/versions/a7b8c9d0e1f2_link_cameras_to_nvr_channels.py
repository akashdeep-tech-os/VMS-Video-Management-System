"""link cameras to their NVR channel and purge bug-generated channel rows

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-09-03 14:30:00.000000

Channel rows used to be identified by their label, which was built as
``f"{nvr.name} - CH{ch}"`` where ``nvr.name`` held the *brand* slug rather than
the operator's Device Name. Two recorders of the same make therefore produced
byte-identical channel labels, and any rename inserted a fresh set of rows
beside the old one because the lookup key was the name itself.

This migration gives a channel a real identity - (nvr_id, channel) - and
removes the rows the old logic generated so the recorders can be re-added with
their proper Device Names.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Rows the buggy discovery loop created: it was the only writer that set
# rtsp_source='brand_convention', and it was the only producer of the
# "<something> - CH<n>" label.
LEGACY_CHANNEL_PREDICATE = "rtsp_source = 'brand_convention' AND name LIKE '% - CH%'"


def upgrade() -> None:
    bind = op.get_bind()

    op.add_column('cameras', sa.Column('nvr_id', sa.Integer(), nullable=True))
    op.add_column('cameras', sa.Column('channel', sa.Integer(), nullable=True))

    # 1. Drop the channel rows generated under the old naming scheme. They are
    #    reproducible at will by re-running discovery, and their labels cannot
    #    be repaired here because the Device Names were never stored.
    purged = bind.execute(
        sa.text(f"DELETE FROM cameras WHERE {LEGACY_CHANNEL_PREDICATE}")
    ).rowcount

    # 2. Drop the NVR rows the old code auto-named, so they get re-registered
    #    with a real Device Name. The tell-tale is name == brand_name (from
    #    `name=nvr_body.brand_name or "NVR"`), plus rows whose ip_address was
    #    never validated and came through blank.
    bind.execute(
        sa.text(
            "DELETE FROM nvrs WHERE TRIM(COALESCE(ip_address, '')) = ''"
            "   OR name = 'NVR'"
            "   OR (brand_name IS NOT NULL AND name = brand_name)"
        )
    )

    # 3. Adopt any surviving channel row into its recorder. Only rows whose
    #    label still carries a channel number are linked; anything else is left
    #    as a standalone camera rather than guessing a channel for it.
    bind.execute(
        sa.text(
            """
            UPDATE cameras
               SET nvr_id = (
                     SELECT n.id FROM nvrs n
                      WHERE n.ip_address = cameras.ip_address
                        AND n.port       = cameras.onvif_port
                        AND n.rtsp_port  = cameras.rtsp_port
                   )
             WHERE nvr_id IS NULL
               AND name LIKE '%-Ch-%'
               AND EXISTS (
                     SELECT 1 FROM nvrs n
                      WHERE n.ip_address = cameras.ip_address
                        AND n.port       = cameras.onvif_port
                        AND n.rtsp_port  = cameras.rtsp_port
                   )
            """
        )
    )
    bind.execute(
        sa.text(
            """
            UPDATE cameras
               SET channel = CAST(
                     substr(name, length(rtrim(name, '0123456789')) + 1) AS INTEGER
                   )
             WHERE nvr_id IS NOT NULL
               AND channel IS NULL
               AND name LIKE '%-Ch-%'
               AND rtrim(name, '0123456789') <> name
            """
        )
    )
    # A row we could not place must not keep a half-set link.
    bind.execute(sa.text("UPDATE cameras SET nvr_id = NULL WHERE channel IS NULL"))

    op.create_index('ix_cameras_nvr_id', 'cameras', ['nvr_id'])
    op.create_index(
        'uq_camera_nvr_channel', 'cameras', ['nvr_id', 'channel'], unique=True
    )

    print(f"[a7b8c9d0e1f2] removed {purged} legacy NVR channel row(s)")


def downgrade() -> None:
    op.drop_index('uq_camera_nvr_channel', table_name='cameras')
    op.drop_index('ix_cameras_nvr_id', table_name='cameras')
    op.drop_column('cameras', 'channel')
    op.drop_column('cameras', 'nvr_id')
