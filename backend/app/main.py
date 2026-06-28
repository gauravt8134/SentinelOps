from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Create the FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Observability, Monitoring & Security Platform"
)

# CORS middleware
# This allows the React frontend to talk to this backend
# Without this, the browser blocks all requests from frontend to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
# This is the first API we ever built in SentinelOps
@app.get("/")
def root():
    return {
        "platform": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "message": "Welcome to SentinelOps API"
    }

# Health check endpoint
# Used by Docker and AWS to check if the server is alive
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "platform": settings.APP_NAME
    }