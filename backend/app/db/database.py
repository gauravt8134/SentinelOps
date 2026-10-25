from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create the database engine
# This is the actual connection to PostgreSQL
engine = create_engine(settings.DATABASE_URL)

# Each request gets its own database session
# SessionLocal is a factory that creates new sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all our database models
# Every table we create will inherit from this
Base = declarative_base()

# Dependency function
# FastAPI calls this to get a database session for each request
# When the request is done, it automatically closes the session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()