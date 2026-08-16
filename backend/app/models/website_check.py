from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class WebsiteCheck(Base):
    __tablename__ = "website_checks"

    id = Column(Integer, primary_key=True, index=True)
    website_id = Column(Integer, ForeignKey("websites.id"), nullable=False)
    status = Column(String, nullable=False)
    response_time_ms = Column(Float, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)

    website = relationship("Website", back_populates="checks")