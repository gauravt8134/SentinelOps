from app.db.database import SessionLocal
from sqlalchemy import text

print("Upgrading PostgreSQL schema for monitoring/auto-heal features...")

db = SessionLocal()
try:
    # Website table — store the last known failure reason + auto-heal cooldown timestamp
    db.execute(text(
        "ALTER TABLE websites ADD COLUMN IF NOT EXISTS failure_reason VARCHAR;"
    ))
    db.execute(text(
        "ALTER TABLE websites ADD COLUMN IF NOT EXISTS last_recovery_attempt TIMESTAMPTZ;"
    ))

    # WebsiteCheck table — store the failure reason per historical check too
    db.execute(text(
        "ALTER TABLE website_checks ADD COLUMN IF NOT EXISTS failure_reason VARCHAR;"
    ))

    db.commit()
    print("Success! Schema is ready for failure_reason + auto-heal cooldown tracking.")
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()