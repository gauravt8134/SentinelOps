from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.rum_log import RUMLog
from app.schemas.rum_log import RUMLogCreate, RUMLogResponse
from typing import List

router = APIRouter()

@router.post("/rum/log", response_model=RUMLogResponse)
def create_rum_log(rum_log: RUMLogCreate, db: Session = Depends(get_db)):
    new_log = RUMLog(
        page_url=rum_log.page_url,
        load_time_ms=rum_log.load_time_ms,
        error_message=rum_log.error_message,
        user_agent=rum_log.user_agent
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.get("/rum/logs", response_model=List[RUMLogResponse])
def get_rum_logs(db: Session = Depends(get_db)):
    logs = db.query(RUMLog).order_by(RUMLog.timestamp.desc()).limit(100).all()
    return logs