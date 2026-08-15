from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.server import Server
from app.schemas.server import ServerCreate, ServerResponse

router = APIRouter()

@router.post("/servers", response_model=ServerResponse)
def create_server(server: ServerCreate, db: Session = Depends(get_db)):
    new_server = Server(
        name=server.name,
        ip_address=server.ip_address,
        status=server.status
    )
    db.add(new_server)
    db.commit()
    db.refresh(new_server)
    return new_server

@router.get("/servers", response_model=List[ServerResponse])
def get_servers(db: Session = Depends(get_db)):
    servers = db.query(Server).all()
    return servers