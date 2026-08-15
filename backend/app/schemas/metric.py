from pydantic import BaseModel
from datetime import datetime

class MetricCreate(BaseModel):
    server_id: int
    cpu_percent: float
    memory_percent: float
    disk_percent: float

class MetricResponse(BaseModel):
    id: int
    server_id: int
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    recorded_at: datetime

    class Config:
        from_attributes = True