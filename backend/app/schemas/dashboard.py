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
