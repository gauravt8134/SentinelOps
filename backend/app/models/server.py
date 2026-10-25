from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class Server(Base):
    __tablename__ = "servers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    ip_address = Column(String, nullable=False)
    status = Column(String, default="unknown")
    created_at = Column(DateTime(timezone=True), server_default=func.now())