"""App configuration"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ""
    database_url: str = "sqlite+aiosqlite:///./neural_threads.db"
    
    class Config:
        env_file = ".env"


settings = Settings()
