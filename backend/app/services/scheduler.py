from apscheduler.schedulers.background import BackgroundScheduler
from app.db.database import SessionLocal
from app.services.website_checker import check_all_websites

def scheduled_check():
    """Wakes up, connects to the DB, runs the pings, and closes the connection."""
    print("⏰ Running automated synthetic monitors...")
    db = SessionLocal()
    try:
        check_all_websites(db)
        print("✅ Automated check complete.")
    finally:
        db.close()

# Initialize the scheduler
scheduler = BackgroundScheduler()

def start_scheduler():
    # Schedule the job to run every 1 minute
    scheduler.add_job(scheduled_check, 'interval', minutes=1)
    scheduler.start()
    print("🚀 Background scheduler started! Monitoring active.")