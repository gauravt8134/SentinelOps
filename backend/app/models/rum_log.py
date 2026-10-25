from sqlalchemy import Column, Integer, String, Float, DateTime
from app.db.database import Base
from datetime import datetime

class RUMLog(Base):
    __tablename__ = "rum_logs"

    id = Column(Integer, primary_key=True, index=True)
    page_url = Column(String, nullable=False)
    load_time_ms = Column(Float, nullable=True)
    error_message = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)