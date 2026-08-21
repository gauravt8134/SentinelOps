from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.sql import func
from app.db.database import Base

class Metric(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(Integer, ForeignKey("servers.id"), nullable=False)

    cpu_percent = Column(Float, nullable=False)
    memory_percent = Column(Float, nullable=False)
    disk_percent = Column(Float, nullable=False)

    # NEW: Swap Memory Tracking
    swap_percent = Column(Float, default=0.0)

    # Existing network/system metrics
    network_in = Column(Float, default=0.0)
    network_out = Column(Float, default=0.0)
    uptime_seconds = Column(Integer, default=0)
    processes = Column(Integer, default=0)

    # METRICS for OS and Process Tracking
    os_type = Column(String, default="Unknown")
    top_process = Column(String, default="Unknown")

    # NEW: Architecture & Runtime Metadata
    arch = Column(String, default="x86_64")
    python_version = Column(String, default="3.11.0")

    # Docker Tracking
    docker_containers = Column(Integer, default=0)

    recorded_at = Column(DateTime(timezone=True), server_default=func.now())