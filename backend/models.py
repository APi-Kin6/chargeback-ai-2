import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, Float, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Premium access
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    premium_source: Mapped[str] = mapped_column(String(50), nullable=True)  # 'nasio' | 'stripe' | 'manual'
    premium_expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    nasio_member_id: Mapped[str] = mapped_column(String(255), nullable=True, index=True)
    dispute_credits: Mapped[int] = mapped_column(Integer, default=0)  # pay-per-use credits

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    disputes: Mapped[list["Dispute"]] = relationship("Dispute", back_populates="user")


class Dispute(Base):
    __tablename__ = "disputes"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)

    # Order details
    platform: Mapped[str] = mapped_column(String(50))           # shopify | etsy | amazon | paypal | stripe
    reason_code: Mapped[str] = mapped_column(String(20))        # e.g. '4853', '13.1', 'UA02'
    dispute_amount: Mapped[float] = mapped_column(Float)
    order_id: Mapped[str] = mapped_column(String(255), nullable=True)
    order_date: Mapped[str] = mapped_column(String(50), nullable=True)
    product_description: Mapped[str] = mapped_column(Text, nullable=True)
    delivery_confirmation: Mapped[str] = mapped_column(String(255), nullable=True)

    # Evidence files (stored as paths/URLs)
    evidence_files: Mapped[dict] = mapped_column(JSON, default=dict)
    # { "tracking": "path", "chat_logs": "path", "tos": "path", "photos": ["path"] }

    # Extracted evidence text (from OCR)
    extracted_evidence: Mapped[dict] = mapped_column(JSON, default=dict)

    # Generated output
    dispute_letter: Mapped[str] = mapped_column(Text, nullable=True)
    evidence_checklist: Mapped[dict] = mapped_column(JSON, default=dict)
    win_probability: Mapped[float] = mapped_column(Float, nullable=True)
    win_probability_explanation: Mapped[str] = mapped_column(Text, nullable=True)

    # Status
    status: Mapped[str] = mapped_column(String(30), default="draft")
    # draft | processing | complete | submitted

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="disputes")


class NasioWebhookLog(Base):
    __tablename__ = "nasio_webhook_logs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    event_type: Mapped[str] = mapped_column(String(100))
    member_email: Mapped[str] = mapped_column(String(255), nullable=True)
    member_id: Mapped[str] = mapped_column(String(255), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON)
    processed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
