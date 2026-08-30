from app.db.database import SessionLocal
from app.models.website import Website  # <--- Added this line!
from app.models.website_check import WebsiteCheck

def verify_latest_metrics():
    db = SessionLocal()
    
    # Fetch the most recent check from the database
    latest = db.query(WebsiteCheck).order_by(WebsiteCheck.id.desc()).first()
    
    if not latest:
        print("No checks found in the database. Run your checker first!")
        return

    print("--- LATEST NETWORK WATERFALL METRICS ---")
    print(f"Website ID : {latest.website_id}")
    print(f"Status     : {latest.status} (HTTP {latest.status_code})")
    print(f"DNS Time   : {latest.dns_time_ms} ms")
    print(f"TCP Time   : {latest.tcp_time_ms} ms")
    print(f"TLS Time   : {latest.tls_time_ms} ms")
    print(f"TTFB       : {latest.ttfb_ms} ms")
    print(f"Total Time : {latest.response_time_ms} ms")
    print(f"Timestamp  : {latest.checked_at}")
    print("----------------------------------------")
    
    db.close()

if __name__ == "__main__":
    verify_latest_metrics()