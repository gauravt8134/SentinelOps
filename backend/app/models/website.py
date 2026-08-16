from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class Website(Base):
    __tablename__ = "websites"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False)
    check_interval_seconds = Column(Integer, default=60)
    status = Column(String, default="unknown")
    last_checked_at = Column(DateTime, nullable=True)
    response_time_ms = Column(Float, nullable=True)

    checks = relationship("WebsiteCheck", back_populates="website")