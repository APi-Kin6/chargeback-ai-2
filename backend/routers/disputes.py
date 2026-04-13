"""
Disputes Router
- POST /api/disputes/              → Create new dispute (premium gated)
- GET  /api/disputes/              → List user's disputes
- GET  /api/disputes/{id}          → Get single dispute
- POST /api/disputes/{id}/generate → Trigger LLM generation
- GET  /api/disputes/{id}/download → Download dispute letter as PDF
- GET  /api/disputes/reason-codes  → List all supported reason codes
"""
from datetime import datetime
from typing import Optional
import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel

from backend.database import get_db
from backend.models import User, Dispute
from backend.auth import get_current_user, get_premium_user
from backend.services.llm_service import generate_dispute_letter, get_evidence_checklist, REASON_CODE_MAP
from backend.services.ocr_service import extract_evidence_text

router = APIRouter(prefix="/api/disputes", tags=["disputes"])

SUPPORTED_PLATFORMS = ["shopify", "etsy", "amazon", "paypal", "stripe"]


class DisputeCreateRequest(BaseModel):
    platform: str
    reason_code: str
    dispute_amount: float
    order_id: Optional[str] = None
    order_date: Optional[str] = None
    product_description: Optional[str] = None
    delivery_confirmation: Optional[str] = None


class DisputeResponse(BaseModel):
    id: str
    platform: str
    reason_code: str
    dispute_amount: float
    order_id: Optional[str]
    status: str
    win_probability: Optional[float]
    created_at: datetime
    completed_at: Optional[datetime]


@router.get("/reason-codes")
async def list_reason_codes():
    return [
        {"code": k, "label": v["label"], "category": v["category"]}
        for k, v in REASON_CODE_MAP.items()
    ]


@router.get("/reason-codes/{code}")
async def get_reason_code(code: str):
    return await get_evidence_checklist(code)


@router.post("/", response_model=DisputeResponse, status_code=201)
async def create_dispute(
    data: DisputeCreateRequest,
    current_user: User = Depends(get_premium_user),
    db: AsyncSession = Depends(get_db),
):
    if data.platform.lower() not in SUPPORTED_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform. Choose from: {SUPPORTED_PLATFORMS}")

    dispute = Dispute(
        user_id=current_user.id,
        platform=data.platform.lower(),
        reason_code=data.reason_code.upper(),
        dispute_amount=data.dispute_amount,
        order_id=data.order_id,
        order_date=data.order_date,
        product_description=data.product_description,
        delivery_confirmation=data.delivery_confirmation,
        status="draft",
    )
    db.add(dispute)
    await db.commit()
    await db.refresh(dispute)
    return _to_response(dispute)


@router.post("/{dispute_id}/evidence")
async def upload_evidence(
    dispute_id: str,
    tracking: Optional[UploadFile] = File(None),
    chat_logs: Optional[UploadFile] = File(None),
    tos_screenshot: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_premium_user),
    db: AsyncSession = Depends(get_db),
):
    dispute = await _get_user_dispute(dispute_id, current_user.id, db)

    files_to_ocr = {}
    file_refs = {}

    if tracking:
        files_to_ocr["tracking"] = await tracking.read()
        file_refs["tracking"] = tracking.filename
    if chat_logs:
        files_to_ocr["chat_logs"] = await chat_logs.read()
        file_refs["chat_logs"] = chat_logs.filename
    if tos_screenshot:
        files_to_ocr["tos"] = await tos_screenshot.read()
        file_refs["tos"] = tos_screenshot.filename

    extracted = await extract_evidence_text(files_to_ocr)
    dispute.evidence_files = file_refs
    dispute.extracted_evidence = extracted

    await db.commit()
    return {"status": "evidence_uploaded", "extracted_keys": list(extracted.keys())}


@router.post("/{dispute_id}/generate")
async def generate_letter(
    dispute_id: str,
    current_user: User = Depends(get_premium_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger LLM generation. Deducts 1 credit if pay-per-use user."""
    dispute = await _get_user_dispute(dispute_id, current_user.id, db)

    if dispute.status == "complete":
        return {"status": "already_complete", "dispute_id": dispute_id}

    # Deduct credit if not subscription user
    has_subscription = (
        current_user.is_premium
        and current_user.premium_expires_at
        and current_user.premium_expires_at > datetime.utcnow()
    )
    if not has_subscription:
        if current_user.dispute_credits <= 0:
            raise HTTPException(status_code=402, detail="No dispute credits remaining")
        current_user.dispute_credits -= 1

    dispute.status = "processing"
    await db.commit()

    try:
        result = await generate_dispute_letter(
            platform=dispute.platform,
            reason_code=dispute.reason_code,
            order_id=dispute.order_id or "",
            order_date=dispute.order_date or "",
            dispute_amount=dispute.dispute_amount,
            product_description=dispute.product_description or "",
            delivery_confirmation=dispute.delivery_confirmation or "",
            extracted_evidence=dispute.extracted_evidence or {},
            seller_name=current_user.full_name or current_user.email,
        )

        dispute.dispute_letter = result.get("dispute_letter", "")
        dispute.evidence_checklist = {
            "provided": result.get("evidence_checklist", {}).get("provided", []),
            "missing": result.get("evidence_checklist", {}).get("missing", []),
            "critical_missing": result.get("evidence_checklist", {}).get("critical_missing", []),
        }
        dispute.win_probability = result.get("win_probability", 0.0)
        dispute.win_probability_explanation = result.get("win_probability_explanation", "")
        dispute.status = "complete"
        dispute.completed_at = datetime.utcnow()
        await db.commit()

        return {
            "status": "complete",
            "dispute_id": dispute_id,
            "win_probability": dispute.win_probability,
            "letter_preview": dispute.dispute_letter[:300] + "..." if dispute.dispute_letter else "",
            "submission_instructions": result.get("submission_instructions", ""),
            "deadline_warning": result.get("deadline_warning", ""),
        }

    except Exception as e:
        dispute.status = "draft"  # Roll back status
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.get("/{dispute_id}")
async def get_dispute(
    dispute_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dispute = await _get_user_dispute(dispute_id, current_user.id, db)
    return {
        "id": dispute.id,
        "platform": dispute.platform,
        "reason_code": dispute.reason_code,
        "dispute_amount": dispute.dispute_amount,
        "order_id": dispute.order_id,
        "order_date": dispute.order_date,
        "product_description": dispute.product_description,
        "delivery_confirmation": dispute.delivery_confirmation,
        "status": dispute.status,
        "win_probability": dispute.win_probability,
        "win_probability_explanation": dispute.win_probability_explanation,
        "dispute_letter": dispute.dispute_letter,
        "evidence_checklist": dispute.evidence_checklist,
        "created_at": dispute.created_at,
        "completed_at": dispute.completed_at,
    }


@router.get("/")
async def list_disputes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dispute)
        .where(Dispute.user_id == current_user.id)
        .order_by(desc(Dispute.created_at))
        .limit(50)
    )
    disputes = result.scalars().all()
    return [_to_response(d) for d in disputes]


@router.get("/{dispute_id}/download")
async def download_letter(
    dispute_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download the dispute letter as a plain text file (PDF generation optional upgrade)."""
    dispute = await _get_user_dispute(dispute_id, current_user.id, db)

    if not dispute.dispute_letter:
        raise HTTPException(status_code=404, detail="No letter generated yet")

    content = dispute.dispute_letter.encode("utf-8")
    filename = f"chargeback_dispute_{dispute.order_id or dispute.id[:8]}.txt"

    return StreamingResponse(
        io.BytesIO(content),
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─── Helpers ────────────────────────────────────────────────────────────────

async def _get_user_dispute(dispute_id: str, user_id: str, db: AsyncSession) -> Dispute:
    result = await db.execute(
        select(Dispute).where(Dispute.id == dispute_id, Dispute.user_id == user_id)
    )
    dispute = result.scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    return dispute


def _to_response(d: Dispute) -> DisputeResponse:
    return DisputeResponse(
        id=d.id,
        platform=d.platform,
        reason_code=d.reason_code,
        dispute_amount=d.dispute_amount,
        order_id=d.order_id,
        status=d.status,
        win_probability=d.win_probability,
        created_at=d.created_at,
        completed_at=d.completed_at,
    )
