from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.db.database import get_db
from app.models.apm_log import APMLog
from app.schemas.apm_log import APMLogResponse
from typing import List

router = APIRouter()

@router.get("/apm/logs", response_model=List[APMLogResponse])
def get_apm_logs(db: Session = Depends(get_db)):
    logs = db.query(APMLog).order_by(APMLog.timestamp.desc()).limit(100).all()
    return logs

@router.get("/apm/stats")
def get_apm_stats(db: Session = Depends(get_db)):
    results = (
        db.query(
            APMLog.endpoint,
            APMLog.method,
            func.count(APMLog.id).label("total_requests"),
            func.avg(APMLog.response_time_ms).label("avg_response_time_ms"),
            func.sum(case((APMLog.status_code >= 400, 1), else_=0)).label("error_count")
        )
        .group_by(APMLog.endpoint, APMLog.method)
        .all()
    )

    stats = []
    for row in results:
        error_rate = (row.error_count / row.total_requests) * 100 if row.total_requests > 0 else 0
        stats.append({
            "endpoint": row.endpoint,
            "method": row.method,
            "total_requests": row.total_requests,
            "avg_response_time_ms": round(row.avg_response_time_ms, 2),
            "error_rate_percent": round(error_rate, 2)
        })

    return stats