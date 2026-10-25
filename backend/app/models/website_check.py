from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone

class WebsiteCheck(Base):
    __tablename__ = "website_checks"

    id = Column(Integer, primary_key=True, index=True)
    website_id = Column(Integer, ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)

    # HTTP Status Tracking
    status = Column(String, nullable=False)        # e.g., "up", "down", "degraded", "assertion_failed"
    status_code = Column(Integer, nullable=True)   # e.g., 200, 404, 502

    # NEW: human-readable reason when status is "down" (e.g. "Connection Refused")
    failure_reason = Column(String, nullable=True)

    # Datadog-style Network Breakdown (in milliseconds)
    response_time_ms = Column(Float, nullable=True) # Total turnaround time
    dns_time_ms = Column(Float, nullable=True)      # Domain lookup time
    tcp_time_ms = Column(Float, nullable=True)      # Connection establishment time
    tls_time_ms = Column(Float, nullable=True)      # SSL/TLS handshake time
    ttfb_ms = Column(Float, nullable=True)          # Time to first byte

    checked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    website = relationship("Website", back_populates="checks")