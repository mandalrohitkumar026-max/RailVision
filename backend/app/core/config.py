"""
Configuration settings for RailOps Intelligence backend.
Supports environment variables with sensible defaults for local development and Docker containers.
"""

from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RailOps Intelligence"
    VERSION: str = "1.8.0"
    API_V1_STR: str = "/api/v1"
    
    # Database: Defaults to local SQLite if POSTGRES_URL not provided
    DATABASE_URL: str = "sqlite:///./railops.db"
    
    # Redis Cache: Defaults to localhost:6379, falls back to in-memory cache if connection fails
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_EXPIRATION_SECONDS: int = 30
    
    # MLflow Tracking
    MLFLOW_TRACKING_URI: str = "./ml/mlruns"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Operational Thresholds
    SEVERE_DELAY_THRESHOLD_MIN: int = 30
    HIGH_OCCUPANCY_THRESHOLD_PCT: float = 105.0

    model_config = {"env_file": ".env", "extra": "allow"}

settings = Settings()
