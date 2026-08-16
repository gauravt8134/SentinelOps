from sqlalchemy import Column, Integer, String, Float, DateTime
from app.db.database import Base
from datetime import datetime

class APMLog(Base):
    __tablename__ = "apm_logs"

    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String, nullable=False)
    method = Column(String, nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time_ms = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)