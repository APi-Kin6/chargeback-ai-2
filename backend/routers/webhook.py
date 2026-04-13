# backend/routers/webhook.py
import hashlib
import hmac
from fastapi import APIRouter, Request, HTTPException, Depends, Header
from sqlalchemy.orm import Session
import logging

# Internal imports (Ensure these match your project structure)
from backend.config import settings
from backend.database import get_db
from backend.models import User
from backend.services.user_service import activate_premium_subscription

# Set up logging for Render
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("webhook")

router = APIRouter(
    prefix="/api/webhook",
    tags=["webhooks"],
)

# ── Dependency: Validate Nas.io Signature ──
async def validate_nasio_signature(request: Request, x_nasio_signature: str = Header(None)):
    """
    Validates the webhook signature from Nas.io to ensure authentic requests.
    Temporarily allows bypassing if the secret is set to 'SKIP_SIGNATURE_VALIDATION'.
    """
    
    # 1. ⚠️ THE TEMPORARY BYPASS (Option 2/3 Fix)
    if settings.NASIO_WEBHOOK_SECRET == "SKIP_SIGNATURE_VALIDATION":
        logger.warning("SIGNATURE VALIDATION BYPASSED. Application is temporarily unsecured.")
        return True  # Proceed without checking the signature

    # 2. Normal validation logic (Secure mode)
    if not x_nasio_signature:
        logger.error("Missing X-Nasio-Signature header.")
        raise HTTPException(status_code=401, detail="Missing Nas.io signature header.")

    payload = await request.body()
    # Nas.io uses HMAC-SHA256 with the secret
    expected_signature = hmac.new(
        settings.NASIO_WEBHOOK_SECRET.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()

    # Securely compare signatures to prevent timing attacks
    if not hmac.compare_digest(x_nasio_signature, expected_signature):
        logger.error("Invalid Nas.io signature matched.")
        raise HTTPException(status_code=401, detail="Invalid Nas.io webhook signature.")
    
    logger.info("Nas.io signature validated.")
    return True

# ── Endpoint: Handle Nas.io Webhook ──
# This endpoint listens at https://your-backend.onrender.com/api/webhook/nasio
@router.post("/nasio", dependencies=[Depends(validate_nasio_signature)])
async def handle_nasio_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receives purchase data from Nas.io and unlocks premium access for the user.
    """
    try:
        # Nas.io sends JSON payload
        data = await request.json()
        logger.info(f"Received webhook payload (validation bypassed): {data}")

        # The key event we care about is usually 'transaction.completed' or 'order.created'
        # The payload format depends on Nas.io's API version. Check their docs.
        
        # Look for the user's email in the payload
        # This structure is an example; you must match it to Nas.io's output.
        email = data.get('customer', {}).get('email') or data.get('email')
        
        if not email:
            logger.error("No email found in webhook payload.")
            raise HTTPException(status_code=422, detail="Customer email is missing from payload.")

        # 3. Call your service to upgrade the user's account status
        # Assumes you have logic to find_by_email and set 'is_premium = True'
        logger.info(f"Upgrading premium access for user: {email}")
        result = activate_premium_subscription(db, email, source="nasio_webhook")

        if not result:
            logger.error(f"Failed to find or upgrade user: {email}")
            raise HTTPException(status_code=404, detail=f"User {email} not found.")
            
        return {"status": "success", "message": f"Premium access granted to {email}."}
    
    except HTTPException as he:
        # Re-raise explicit HTTP errors
        raise he
    except Exception as e:
        logger.error(f"CRITICAL ERROR processing Nas.io webhook: {e}")
        # Always return 200 or 201 to a webhook to avoid infinite retries,
        # unless it truly is a server crash.
        return {"status": "error", "message": "Internal processing error."}