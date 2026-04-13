# backend/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    """
    Application configuration settings.
    Loads from environment variables and an optional .env file.
    """
    APP_NAME: str = "Chargeback Defender"
    DEBUG: bool = False
    
    # ── Render-Injected Variables ─────────────────────────────
    # This is automatically set by Render when linked to the DB
    DATABASE_URL: str = ""
    # Render also sets $PORT, which Uvicorn reads.
    
    # ── Secrets (Set in Render Dashboard -> Environment) ─────────
    # A secure JWT secret for creating access tokens
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week

    # Anthropic API Key for the Claude LLM service
    ANTHROPIC_API_KEY: str

    # ── Temporary Webhook Fix ──
    # Value will be: "SKIP_SIGNATURE_VALIDATION" until you get the real secret
    NASIO_WEBHOOK_SECRET: str
    
    # Your unique Nas.io community ID (from their URL)
    NASIO_COMMUNITY_SLUG: str = "ecommerce-defender-room"
    
    # Optional: Stripe (Future use)
    STRIPE_SECRET_KEY: str = ""
    
    # Load settings from environment variables
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        # Ignore extra variables Render might inject
        extra="ignore"
    )

@lru_cache()
def get_settings():
    """Returns a cached instance of the settings."""
    return Settings()

# Global settings instance
settings = get_settings()