from app.db.database import engine, Base
# We MUST import the models so SQLAlchemy knows their exact structure
from app.models.website import Website
from app.models.website_check import WebsiteCheck
from app.models.server import Server
from app.models.metric import Metric
from app.models.apm_log import APMLog
from app.models.rum_log import RUMLog

print("Dropping all existing PostgreSQL tables...")
Base.metadata.drop_all(bind=engine)

print("Rebuilding tables with the latest schema...")
Base.metadata.create_all(bind=engine)

print("Success! The database is strictly synced with your models.")