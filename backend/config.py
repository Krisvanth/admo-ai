"""
Admo AI - Configuration Module

Production-grade configuration management using Pydantic Settings.
All sensitive credentials should be stored in .env file (never commit to git).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, computed_field
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Priority order:
    1. Environment variables
    2. .env file
    3. Default values (if provided)
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # Ignore extra env vars not defined here
    )
    
    # ===================
    # Application Settings
    # ===================
    APP_NAME: str = Field(default="Admo AI", description="Application name")
    APP_ENV: str = Field(default="development", description="Environment: development, staging, production")
    DEBUG: bool = Field(default=True, description="Debug mode")
    
    # ===================
    # Database Settings (PostgreSQL)
    # ===================
    POSTGRES_USER: str = Field(default="postgres", description="PostgreSQL username")
    POSTGRES_PASSWORD: str = Field(default="password", description="PostgreSQL password")
    POSTGRES_HOST: str = Field(default="localhost", description="PostgreSQL host")
    POSTGRES_PORT: int = Field(default=5432, description="PostgreSQL port")
    POSTGRES_DB: str = Field(default="admo_ai", description="PostgreSQL database name")
    
    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """Construct async PostgreSQL connection URL."""
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @computed_field
    @property
    def DATABASE_URL_SYNC(self) -> str:
        """Construct sync PostgreSQL connection URL (for migrations)."""
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # ===================
    # Security Settings
    # ===================
    SECRET_KEY: str = Field(
        default="CHANGE-THIS-IN-PRODUCTION-use-openssl-rand-hex-32",
        description="Secret key for JWT signing. Generate with: openssl rand -hex 32"
    )
    ALGORITHM: str = Field(default="HS256", description="JWT signing algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="JWT token expiry in minutes")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token expiry in days")
    
    # ===================
    # CORS Settings
    # ===================
    CORS_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
        description="Comma-separated list of allowed origins"
    )
    
    @computed_field
    @property
    def CORS_ORIGINS_LIST(self) -> list[str]:
        """Parse CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # ===================
    # Email Settings (for notifications)
    # ===================
    SMTP_HOST: Optional[str] = Field(default=None, description="SMTP server host")
    SMTP_PORT: int = Field(default=587, description="SMTP server port")
    SMTP_USER: Optional[str] = Field(default=None, description="SMTP username")
    SMTP_PASSWORD: Optional[str] = Field(default=None, description="SMTP password")
    SMTP_FROM_EMAIL: Optional[str] = Field(default=None, description="From email address")
    SMTP_TLS: bool = Field(default=True, description="Use TLS for SMTP")
    
    # ===================
    # External API Keys (for future integrations)
    # ===================
    OPENAI_API_KEY: Optional[str] = Field(default=None, description="OpenAI API key for AI features")
    TWILIO_ACCOUNT_SID: Optional[str] = Field(default=None, description="Twilio account SID for SMS")
    TWILIO_AUTH_TOKEN: Optional[str] = Field(default=None, description="Twilio auth token")
    TWILIO_PHONE_NUMBER: Optional[str] = Field(default=None, description="Twilio phone number")
    
    # ===================
    # Rate Limiting
    # ===================
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, description="API rate limit per minute per user")
    
    # ===================
    # Logging
    # ===================
    LOG_LEVEL: str = Field(default="INFO", description="Logging level: DEBUG, INFO, WARNING, ERROR")
    
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.APP_ENV.lower() == "production"
    
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.APP_ENV.lower() == "development"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Uses lru_cache to ensure settings are only loaded once.
    """
    return Settings()


# Create a global settings instance for easy imports
settings = get_settings()
