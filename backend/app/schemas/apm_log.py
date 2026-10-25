from pydantic import BaseModel
from datetime import datetime

class APMLogResponse(BaseModel):
    id: int
    endpoint: str
    method: str
    status_code: int
    response_time_ms: float
    timestamp: datetime

    class Config:
        from_attributes = True