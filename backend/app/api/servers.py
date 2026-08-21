from fastapi import APIRouter, Depends, HTTPException
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

@router.put("/servers/{server_id}", response_model=ServerResponse)
def update_server(server_id: int, server_update: ServerCreate, db: Session = Depends(get_db)):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    server.name = server_update.name
    server.ip_address = server_update.ip_address
    server.status = server_update.status
    
    db.commit()
    db.refresh(server)
    return server

@router.delete("/servers/{server_id}")
def delete_server(server_id: int, db: Session = Depends(get_db)):
    server = db.query(Server).filter(Server.id == server_id).first()

    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    db.delete(server)
    db.commit()

    return {"message": f"Server {server_id} deleted successfully"}