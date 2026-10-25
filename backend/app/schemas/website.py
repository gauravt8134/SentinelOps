from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# NEW: Schema to send the historical waterfall metrics to React
class WebsiteCheckResponse(BaseModel):
    id: int
    status: str
    status_code: Optional[int] = None
    response_time_ms: Optional[float] = None
    dns_time_ms: Optional[float] = None
    tcp_time_ms: Optional[float] = None
    tls_time_ms: Optional[float] = None
    ttfb_ms: Optional[float] = None
    checked_at: datetime

    class Config:
        from_attributes = True

class WebsiteCreate(BaseModel):
    url: str
    check_interval_seconds: int = 60
    # NEW: Allow users to submit text assertions
    expected_text: Optional[str] = None 

class WebsiteResponse(BaseModel):
    id: int
    url: str
    check_interval_seconds: int
    status: str
    last_checked_at: Optional[datetime] = None
    response_time_ms: Optional[float] = None
    ssl_expiry_days: Optional[int] = None
    
    # NEW: Show the expected text if one was set
    expected_text: Optional[str] = None 
    
    # NEW: Send the history array so React can build the Uptime Sparklines!
    checks: List[WebsiteCheckResponse] = [] 

    class Config:
        from_attributes = True