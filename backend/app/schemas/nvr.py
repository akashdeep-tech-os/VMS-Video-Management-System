from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class NVRBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    ip_address: str = Field(min_length=7, max_length=45)
    port: int = Field(default=80, ge=1, le=65535)
    rtsp_port: int = Field(default=554, ge=1, le=65535)
    username: str = Field(default="", max_length=255)
    password: str = Field(default="", max_length=255)


class NVRCreate(NVRBase):
    no_of_channels: int | None = None
    brand_name: str | None = None
    model_number: str | None = None
    manufacturer: str | None = None


class NVRUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    ip_address: str | None = Field(default=None, min_length=7, max_length=45)
    port: int | None = Field(default=None, ge=1, le=65535)
    rtsp_port: int | None = Field(default=None, ge=1, le=65535)
    username: str | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, max_length=255)
    enabled: bool | None = None
    no_of_channels: int | None = None
    brand_name: str | None = None
    model_number: str | None = None


class NVRRead(NVRBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    manufacturer: str | None = None
    model: str | None = None
    firmware: str | None = None
    serial: str | None = None
    enabled: bool = True
    no_of_channels: int | None = None
    brand_name: str | None = None
    created_at: datetime
    updated_at: datetime


class NVRDiscoverRequest(BaseModel):
    """Body for the ID-less discover endpoint."""

    # The Device Name typed by the operator. This is what channel labels are
    # built from, so it must never be confused with brand_name: several
    # recorders can share a brand, but each needs its own distinguishable name.
    name: str | None = Field(default=None, max_length=120)
    brand_name: str | None = None
    ip_address: str = Field(min_length=1, max_length=45)
    rtsp_port: int | None = Field(default=None, ge=1, le=65535)
    onvif_port: int | None = Field(default=None, ge=1, le=65535)
    username: str | None = None
    plain_password: str | None = None
    no_of_channels: int | None = Field(default=None, ge=1, le=128)
    # False registers a single standalone camera, which is labelled with the
    # device name verbatim (no "-Ch-N" suffix).
    is_nvr: bool = True

    @field_validator("name", "brand_name", "ip_address")
    @classmethod
    def _strip(cls, v: str | None) -> str | None:
        return v.strip() if isinstance(v, str) else v

    @field_validator("ip_address")
    @classmethod
    def _require_host(cls, v: str) -> str:
        if not v:
            raise ValueError("ip_address must not be blank")
        return v

