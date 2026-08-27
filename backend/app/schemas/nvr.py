from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NVRBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    ip_address: str = Field(min_length=7, max_length=45)
    port: int = Field(default=80, ge=1, le=65535)
    username: str = Field(default="", max_length=255)
    password: str = Field(default="", max_length=255)


class NVRCreate(NVRBase):
    pass


class NVRUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    ip_address: str | None = Field(default=None, min_length=7, max_length=45)
    port: int | None = Field(default=None, ge=1, le=65535)
    username: str | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, max_length=255)
    enabled: bool | None = None


class NVRRead(NVRBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    manufacturer: str | None = None
    model: str | None = None
    firmware: str | None = None
    serial: str | None = None
    enabled: bool = True
    created_at: datetime
    updated_at: datetime
