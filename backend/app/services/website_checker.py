import requests
import time
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.website import Website
from app.models.website_check import WebsiteCheck

def check_website(url: str):
    start_time = time.time()

    try:
        response = requests.get(url, timeout=10)
        end_time = time.time()

        response_time_ms = (end_time - start_time) * 1000

        if response.status_code < 400:
            status = "up"
        else:
            status = "down"

    except requests.exceptions.RequestException:
        response_time_ms = None
        status = "down"

    return {
        "status": status,
        "response_time_ms": response_time_ms,
        "checked_at": datetime.utcnow()
    }

def check_all_websites(db: Session):
    websites = db.query(Website).all()

    for website in websites:
        result = check_website(website.url)

        website.status = result["status"]
        website.response_time_ms = result["response_time_ms"]
        website.last_checked_at = result["checked_at"]

        new_check = WebsiteCheck(
            website_id=website.id,
            status=result["status"],
            response_time_ms=result["response_time_ms"],
            checked_at=result["checked_at"]
        )
        db.add(new_check)

    db.commit()