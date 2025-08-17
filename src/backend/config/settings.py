from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/parenting_app"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # JWT Settings
    secret_key: str = "your-super-secret-jwt-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    
    # OpenAI Configuration
    openai_api_key: str = ""
    openai_model: str = "gpt-4-turbo-preview"
    
    # Application Settings
    app_name: str = "Parenting App"
    app_version: str = "1.0.0"
    debug: bool = True
    allowed_hosts: List[str] = ["localhost", "127.0.0.1"]
    
    # Celery Configuration
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/1"
    
    # CORS Settings
    frontend_url: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
