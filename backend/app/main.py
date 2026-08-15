from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import Base, engine
from app.models import server  # noqa: F401
from app.models import metric  # noqa: F401
from app.api import servers
from app.api import metrics

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Observability, Monitoring & Security Platform"
)

app.include_router(servers.router)
app.include_router(metrics.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "platform": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "message": "Welcome to SentinelOps API"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "platform": settings.APP_NAME
    }