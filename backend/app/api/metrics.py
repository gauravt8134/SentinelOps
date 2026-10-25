from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.metric import Metric
from app.models.server import Server
from app.schemas.metric import MetricCreate, MetricResponse

router = APIRouter()

@router.post("/metrics", response_model=MetricResponse)
def create_metric(metric: MetricCreate, db: Session = Depends(get_db)):
    server = db.query(Server).filter(Server.id == metric.server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    new_metric = Metric(
        server_id=metric.server_id,
        cpu_percent=metric.cpu_percent,
        memory_percent=metric.memory_percent,
        disk_percent=metric.disk_percent,
        network_in=metric.network_in,
        network_out=metric.network_out,
        uptime_seconds=metric.uptime_seconds,
        processes=metric.processes,
        os_type=metric.os_type,
        top_process=metric.top_process,
        
        # THE NEW FEATURE: Docker Tracking!
        docker_containers=metric.docker_containers
    )
    db.add(new_metric)
    db.commit()
    db.refresh(new_metric)
    return new_metric

@router.get("/metrics/{server_id}", response_model=List[MetricResponse])
def get_metrics_for_server(server_id: int, db: Session = Depends(get_db)):
    metrics = db.query(Metric).filter(Metric.server_id == server_id).all()
    return metrics