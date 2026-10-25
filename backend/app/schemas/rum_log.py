from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class RUMLogCreate(BaseModel):
    page_url: str
    load_time_ms: Optional[float] = None
    error_message: Optional[str] = None
    user_agent: Optional[str] = None

class RUMLogResponse(BaseModel):
    id: int
    page_url: str
    load_time_ms: Optional[float] = None
    error_message: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True