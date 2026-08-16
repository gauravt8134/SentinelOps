from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class WebsiteCreate(BaseModel):
    url: str
    check_interval_seconds: int = 60

class WebsiteResponse(BaseModel):
    id: int
    url: str
    check_interval_seconds: int
    status: str
    last_checked_at: Optional[datetime] = None
    response_time_ms: Optional[float] = None

    class Config:
        from_attributes = True