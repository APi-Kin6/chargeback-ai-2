from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ChargebackDefender"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/chargebackdb"

    # JWT
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_OPENSSL_RAND"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Anthropic
    ANTHROPIC_API_KEY: str = ""

    # Nas.io
    NASIO_WEBHOOK_SECRET: str = ""
    NASIO_COMMUNITY_SLUG: str = "ecommerce-defender-room"

    # Stripe (optional payment fallback)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # OCR (Google Vision or fallback to pytesseract)
    GOOGLE_VISION_KEY: str = ""
    USE_GOOGLE_VISION: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
