from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.website import Website
from app.models.website_check import WebsiteCheck
from app.schemas.website import WebsiteCreate, WebsiteResponse
from typing import List

router = APIRouter()

@router.post("/websites", response_model=WebsiteResponse)
def create_website(website: WebsiteCreate, db: Session = Depends(get_db)):
    new_website = Website(
        url=website.url,
        check_interval_seconds=website.check_interval_seconds
    )
    db.add(new_website)
    db.commit()
    db.refresh(new_website)
    return new_website

@router.get("/websites", response_model=List[WebsiteResponse])
def get_websites(db: Session = Depends(get_db)):
    websites = db.query(Website).all()
    return websites

@router.get("/websites/{website_id}/checks")
def get_website_checks(website_id: int, db: Session = Depends(get_db)):
    checks = db.query(WebsiteCheck).filter(WebsiteCheck.website_id == website_id).all()
    return checks