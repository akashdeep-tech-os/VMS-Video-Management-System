from pydantic import BaseModel


class DashboardStats(BaseModel):
    total: int
    enabled: int
    online: int
    offline: int
    disabled: int
    live_streams: int
    cpu: float | None = None
    memory: float | None = None


class DashboardUsers(BaseModel):
    total: int
    active: int


class DashboardCameras(BaseModel):
    total: int
    stations: int


class DashboardOnline(BaseModel):
    count: int
    uptime_pct: float


class DashboardOffline(BaseModel):
    count: int


class DashboardAlerts(BaseModel):
    total: int
    critical: int


class DashboardSummary(BaseModel):
    users: DashboardUsers
    cameras: DashboardCameras
    online: DashboardOnline
    offline: DashboardOffline
    alerts: DashboardAlerts


class StationCameraStats(BaseModel):
    station_name: str
    total: int
    working: int
    non_working: int
