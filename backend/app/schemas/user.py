from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    id: int
    username: str
    first_name: str = ""
    last_name: str = ""
    full_name: str
    role: str


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=80, pattern=r"^[A-Za-z0-9._-]+$")
    password: str = Field(min_length=6, max_length=128)
    role: Literal["ADMIN", "USER"] = "USER"
    active: bool = True
    base_rights: list[str] | None = None
    channel_rights: dict[str, list[int]] | None = None


class UserUpdate(BaseModel):
    """Partial update. ``role``/``active``/``password`` only - usernames are immutable."""

    role: Literal["ADMIN", "USER"] | None = None
    active: bool | None = None
    password: str | None = Field(default=None, min_length=6, max_length=128)
    base_rights: list[str] | None = None
    channel_rights: dict[str, list[int]] | None = None


class PasswordUpdate(BaseModel):
    new_password: str = Field(min_length=6, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    role: str
    active: bool
    base_rights: list[str]
    channel_rights: dict[str, list[int]]
    created_at: datetime
    updated_at: datetime


class RightItem(BaseModel):
    id: int
    rights_name: str


class RightGroup(BaseModel):
    """Grouped rights, matching the shape the Users page consumes."""

    scope: str = "base"
    rights: list[RightItem]


class RightCatalogItem(BaseModel):
    id: int
    rights_name: str
    ui_id: str
    label: str
    description: str


class AccessibleCamera(BaseModel):
    camera_id: int
    name: str
    online: bool
    camera_type: str = "bullet"
