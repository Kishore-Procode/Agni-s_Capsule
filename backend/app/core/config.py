from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List
import json
import os
import sys


TEST_ENV = "PYTEST_CURRENT_TEST" in os.environ or "pytest" in sys.modules


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    PROJECT_NAME: str = "Agni's Capsule"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    SECRET_KEY: str = os.getenv("SECRET_KEY", "test-secret-key-for-local-dev-only" if TEST_ENV else "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./agni_capsule.db")

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    STORAGE_PROVIDER: str = "local"
    LOCAL_STORAGE_DIR: str = "./storage/encrypted_vaults"

    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_USE_MOCK: bool = os.getenv("GOOGLE_USE_MOCK", "false").strip().lower() in {"1", "true", "yes", "on", "y"}
    GOOGLE_AUTH_REDIRECT_URI: str = os.getenv("GOOGLE_AUTH_REDIRECT_URI", "http://localhost:5173/auth/google/callback")
    GOOGLE_DRIVE_REDIRECT_URI: str = os.getenv("GOOGLE_DRIVE_REDIRECT_URI", "http://localhost:5173/vault")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        if TEST_ENV:
            return value or "test-secret-key-for-pytest-only"
        if not value or len(value) < 32:
            raise ValueError("SECRET_KEY must be set to a secure value in the environment.")
        return value

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        default_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
        ]
        if value is None:
            return default_origins

        if isinstance(value, str):
            candidate = value.strip()
            if not candidate:
                return default_origins

            try:
                parsed = json.loads(candidate)
                if isinstance(parsed, list):
                    return [str(item).strip().strip('"') for item in parsed if str(item).strip()]
            except json.JSONDecodeError:
                pass

            return [
                item.strip().strip('"')
                for item in candidate.split(",")
                if item.strip()
            ]
        return value


settings = Settings()
