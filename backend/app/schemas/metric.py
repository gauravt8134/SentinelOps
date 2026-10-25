from pydantic import BaseModel
from datetime import datetime

class MetricCreate(BaseModel):
    server_id: int
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    
    # NEW: Swap Memory Tracking
    swap_percent: float = 0.0

    # Existing network/system metrics
    network_in: float = 0.0
    network_out: float = 0.0
    uptime_seconds: int = 0
    processes: int = 0

    # OS and Process Tracking
    os_type: str = "Unknown"
    top_process: str = "Unknown"

    # NEW: Architecture & Runtime Metadata
    arch: str = "x86_64"
    python_version: str = "3.11.0"

    # Docker Tracking
    docker_containers: int = 0

class MetricResponse(BaseModel):
    id: int
    server_id: int
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    
    # NEW: Swap Memory Tracking
    swap_percent: float = 0.0

    # Existing network/system metrics
    network_in: float = 0.0
    network_out: float = 0.0
    uptime_seconds: int = 0
    processes: int = 0
    
    # OS and Process Tracking
    os_type: str = "Unknown"
    top_process: str = "Unknown"

    # NEW: Architecture & Runtime Metadata
    arch: str = "x86_64"
    python_version: str = "3.11.0"

    # Docker Tracking
    docker_containers: int = 0
    
    recorded_at: datetime

    class Config:
        from_attributes = True