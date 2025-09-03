"""
Configuration settings for the FastAPI application
"""
import os
from typing import List
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings

try:
    from dotenv import load_dotenv
    # Load environment variables
    load_dotenv()
except ImportError:
    pass

class Settings(BaseSettings):
    """Application settings"""
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Firebase settings
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_PRIVATE_KEY_PATH: str = os.getenv("FIREBASE_PRIVATE_KEY_PATH", "")
    
    # Admin settings
    AUTHORIZED_ADMIN_EMAILS: List[str] = os.getenv(
        "AUTHORIZED_ADMIN_EMAILS", 
        "jeromessenyonjo@gmail.com,denis.omoding@watotochurch.com"
    ).split(",")
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "https://watoto-lubowa.github.io",
        # Add your frontend URLs here
    ]
    
    # Validation constants
    MIN_NAME_LENGTH: int = 2
    MIN_PHONE_LENGTH: int = 7
    MAX_PHONE_LENGTH: int = 15
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()
