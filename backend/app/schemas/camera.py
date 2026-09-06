from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.core.config import settings


class CameraBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    ip_address: str = Field(min_length=7, max_length=45)
    onvif_port: int = Field(default=80, ge=1, le=65535)
    rtsp_port: int = Field(default=554, ge=1, le=65535)
    username: str = Field(default="", max_length=255)
    password: str = Field(default="", max_length=255)
    rtsp_sub_path: str | None = Field(default=None, max_length=255)
    latitude: float | None = None
    longitude: float | None = None


class CameraCreate(CameraBase):
    pass


class CameraCreateRtsp(BaseModel):
    """Create a camera directly from an RTSP URL (no ONVIF probe)."""

    name: str = Field(min_length=1, max_length=120)
    rtsp_url: str = Field(min_length=1, max_length=500)
    rtsp_sub_url: str | None = Field(default=None, max_length=500)
    latitude: float | None = None
    longitude: float | None = None


class CameraUpdate(BaseModel):
    """All fields optional; only provided fields are applied.

    An empty password means "keep the current one" so the edit form does not
    need to fetch the stored credential.
    """

    name: str | None = Field(default=None, min_length=1, max_length=120)
    ip_address: str | None = Field(default=None, min_length=7, max_length=45)
    onvif_port: int | None = Field(default=None, ge=1, le=65535)
    rtsp_port: int | None = Field(default=None, ge=1, le=65535)
    username: str | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, max_length=255)
    rtsp_sub_path: str | None = Field(default=None, max_length=255)
    latitude: float | None = None
    longitude: float | None = None
    enabled: bool | None = None


class CameraRead(CameraBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nvr_id: int | None = None
    channel: int | None = None
    manufacturer: str | None = None
    model: str | None = None
    firmware: str | None = None
    serial: str | None = None
    rtsp_path: str | None = None
    rtsp_source: str = "none"
    stream_state: str = "idle"
    enabled: bool = True
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime
    updated_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def webrtc_url(self) -> str:
        """WHEP endpoint the browser connects to directly (never relayed by the backend)."""
        return f"{settings.mediamtx_webrtc_url.rstrip('/')}/cam_{self.id}/whep"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sub_webrtc_url(self) -> str:
        """WHEP endpoint for the sub (low-resolution) stream."""
        return f"{settings.mediamtx_webrtc_url.rstrip('/')}/cam_{self.id}_sub/whep"


class CameraStatus(BaseModel):
    camera_id: int
    onvif_reachable: bool
    stream_publishing: bool
    state: Literal["online", "offline", "disabled"]
