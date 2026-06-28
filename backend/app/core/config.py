from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "SentinelOps"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://sentinelops:sentinelops123@localhost:5432/sentinelops"

    # Security
    SECRET_KEY: str = "sentinelops-secret-key-change-in-production"

    class Config:
        env_file = ".env"

settings = Settings()