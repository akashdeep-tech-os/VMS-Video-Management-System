from typing import Literal

from pydantic import BaseModel


class CpuInfo(BaseModel):
    usage_pct: float
    cores: int


class RamInfo(BaseModel):
    total_gb: float
    used_gb: float
    free_gb: float
    used_pct: float


class StorageInfo(BaseModel):
    total_gb: float
    used_gb: float
    free_gb: float
    used_pct: float
    free_pct: float


class SystemHealthResponse(BaseModel):
    overall: Literal["operational", "degraded"]
    cpu: CpuInfo
    ram: RamInfo
    storage: StorageInfo
