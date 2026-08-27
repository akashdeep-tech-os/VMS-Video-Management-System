from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Camera(Base):
    """An ONVIF camera registered for the load test.

    Note: credentials are stored in plain text on purpose - this is a LAN
    load-testing tool and MediaMTX needs the plain RTSP credentials to pull
    the camera stream.
    """

    __tablename__ = "cameras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    onvif_port: Mapped[int] = mapped_column(Integer, nullable=False, default=80, server_default="80")
    rtsp_port: Mapped[int] = mapped_column(Integer, nullable=False, default=554, server_default="554")
    username: Mapped[str] = mapped_column(String(255), nullable=False, default="", server_default="")
    password: Mapped[str] = mapped_column(String(255), nullable=False, default="", server_default="")

    # Device info fetched over ONVIF when the camera is added.
    manufacturer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    firmware: Mapped[str | None] = mapped_column(String(255), nullable=True)
    serial: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # RTSP stream path (the part after host:port). The full URL is built on
    # the fly because credentials can change.
    rtsp_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    rtsp_source: Mapped[str] = mapped_column(String(16), nullable=False, default="none", server_default="none")  # onvif | fallback | none

    # Stream registration state with MediaMTX: idle | registered | error.
    stream_state: Mapped[str] = mapped_column(String(16), nullable=False, default="idle", server_default="idle")

    # GPS coordinates for map display.
    # Organization placement — which station/site this camera belongs to.
    station_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    station_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    site_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    site_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    latitude: Mapped[float | None] = mapped_column(nullable=True)
    longitude: Mapped[float | None] = mapped_column(nullable=True)

    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )
