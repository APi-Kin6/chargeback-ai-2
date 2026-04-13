"""
Nas.io Webhook Integration
--------------------------
Nas.io sends webhooks on member join/leave/renewal.
We use these to grant/revoke premium access on ChargebackDefender.

Webhook Setup (in Nas.io dashboard):
  URL: https://your-api.onrender.com/api/webhooks/nasio
  Events: member.joined, member.left, member.renewed, member.payment_failed

Magic Link Flow:
  1. Seller joins Nas.io community
  2. Nas.io redirects to your "magic link" URL with ?email=...&token=...
  3. We verify token, auto-login/register seller, grant premium
"""

import hmac
import hashlib
import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Request, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.models import User, NasioWebhookLog
from backend.auth import hash_password, create_access_token
from backend.config import get_settings

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])
settings = get_settings()

NASIO_EVENTS = {
    "member.joined": "grant",
    "member.renewed": "grant",
    "member.payment_success": "grant",
    "member.left": "revoke",
    "member.payment_failed": "revoke",
    "member.cancelled": "revoke",
}


def verify_nasio_signature(payload: bytes, signature: str) -> bool:
    """HMAC-SHA256 verification for Nas.io webhooks."""
    if not settings.NASIO_WEBHOOK_SECRET:
        return True  # Skip verification in dev
    expected = hmac.new(
        settings.NASIO_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


@router.post("/nasio")
async def nasio_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("x-nasio-signature", "")

    if not verify_nasio_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = payload.get("event")
    member = payload.get("member", {})
    member_email = member.get("email", "").lower().strip()
    member_id = member.get("id", "")

    # Log all webhooks
    log = NasioWebhookLog(
        event_type=event_type,
        member_email=member_email,
        member_id=member_id,
        payload=payload,
    )
    db.add(log)

    action = NASIO_EVENTS.get(event_type)
    if not action or not member_email:
        await db.commit()
        return {"status": "ignored", "event": event_type}

    # Find or create user
    result = await db.execute(select(User).where(User.email == member_email))
    user = result.scalar_one_or_none()

    if not user:
        # Auto-create account for new Nas.io member
        import secrets
        user = User(
            email=member_email,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            full_name=member.get("name", ""),
            nasio_member_id=member_id,
        )
        db.add(user)
        await db.flush()

    if action == "grant":
        user.is_premium = True
        user.premium_source = "nasio"
        user.nasio_member_id = member_id
        user.premium_expires_at = datetime.utcnow() + timedelta(days=32)  # Buffer
    else:
        user.is_premium = False
        user.premium_expires_at = datetime.utcnow()

    log.processed = True
    await db.commit()

    return {"status": "ok", "action": action, "email": member_email}


@router.get("/nasio/magic-link")
async def nasio_magic_link(
    email: str = Query(...),
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Magic Link handler — Nas.io redirects here after member joins.
    Verifies token, auto-registers/logs in seller, returns JWT.
    
    Configure in Nas.io: Redirect URL = https://your-app.com/api/webhooks/nasio/magic-link
    """
    # Verify token is a valid HMAC of email signed with your secret
    expected_token = hmac.new(
        settings.NASIO_WEBHOOK_SECRET.encode() if settings.NASIO_WEBHOOK_SECRET else b"dev",
        email.lower().encode(),
        hashlib.sha256,
    ).hexdigest()[:32]

    if settings.NASIO_WEBHOOK_SECRET and not hmac.compare_digest(token, expected_token):
        raise HTTPException(status_code=401, detail="Invalid magic link token")

    email = email.lower().strip()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        import secrets
        user = User(
            email=email,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            is_premium=True,
            premium_source="nasio",
            premium_expires_at=datetime.utcnow() + timedelta(days=32),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        if not user.is_premium:
            user.is_premium = True
            user.premium_source = "nasio"
            user.premium_expires_at = datetime.utcnow() + timedelta(days=32)
            await db.commit()

    jwt_token = create_access_token(user.id, user.email)

    # Redirect to frontend with token
    from fastapi.responses import RedirectResponse
    return RedirectResponse(
        url=f"https://your-frontend.onrender.com/auth/callback?token={jwt_token}&premium=true",
        status_code=302,
    )


@router.post("/stripe")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Stripe webhook for pay-per-dispute credits ($9/dispute)."""
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        customer_email = session.get("customer_email", "").lower()
        credits_purchased = int(session.get("metadata", {}).get("dispute_credits", 1))

        result = await db.execute(select(User).where(User.email == customer_email))
        user = result.scalar_one_or_none()
        if user:
            user.dispute_credits += credits_purchased
            await db.commit()

    return {"status": "ok"}
