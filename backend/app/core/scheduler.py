from apscheduler.schedulers.background import BackgroundScheduler
from app.db.database import SessionLocal
from app.services.website_checker import check_all_websites

scheduler = BackgroundScheduler()

def scheduled_website_check():
    db = SessionLocal()
    try:
        check_all_websites(db)
    finally:
        db.close()

def start_scheduler():
    scheduler.add_job(scheduled_website_check, "interval", seconds=60)
    scheduler.start()