from app.db.database import SessionLocal
from sqlalchemy import text

print("Upgrading PostgreSQL schema for Docker...")

db = SessionLocal()
try:
    # Forces PostgreSQL to add the missing Docker column!
    db.execute(text("ALTER TABLE metrics ADD COLUMN IF NOT EXISTS docker_containers INTEGER DEFAULT 0;"))
    db.commit()
    print("Success! The database schema is ready for Docker data.")
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()