from app.db.database import engine, Base
# Import model modules so SQLAlchemy registers them on Base.metadata
try:
    from app.models import server, metric
except ImportError:
    pass

def reset_database():
    print("Dropping existing tables and recreating with the new schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Success! Database tables dropped and recreated with all new columns.")

if __name__ == "__main__":
    reset_database()