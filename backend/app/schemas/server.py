from pydantic import BaseModel
from datetime import datetime

class ServerCreate(BaseModel):
    name: str
    ip_address: str
    status: str = "unknown"

class ServerResponse(BaseModel):
    id: int
    name: str
    ip_address: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True