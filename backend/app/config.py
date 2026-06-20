from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite:///{Path(__file__).resolve().parent.parent / 'banking_app.db'}"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 525600
    REFRESH_TOKEN_EXPIRE_DAYS: int = 365
    
    class Config:
        env_file = ".env"

settings = Settings()
