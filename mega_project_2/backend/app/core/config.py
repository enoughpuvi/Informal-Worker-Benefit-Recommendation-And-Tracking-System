import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Apana Benefits - Informal Worker Welfare Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "academic-mega-project-secret-key-informal-workers-2026-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days session persistence for workers
    
    # SQLite by default with zero setup; supports PostgreSQL via env variable
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'informal_benefits.db'}")
    
    UPLOAD_PATH: str = str(UPLOAD_DIR)
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB limit
    
    # Optional Gemini AI API Key for RAG chatbot enhancements
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "*"
    ]

    model_config = SettingsConfigDict(case_sensitive=True, extra="allow")

settings = Settings()
