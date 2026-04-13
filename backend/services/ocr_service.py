"""
OCR Service — Extract text from uploaded evidence files.
Supports: PNG, JPEG, PDF screenshots (tracking, chat logs, ToS)
Primary: pytesseract (free, self-hosted)
Upgrade: Google Vision API (set USE_GOOGLE_VISION=true)
"""
import io
import base64
from pathlib import Path
from typing import Optional

from backend.config import get_settings

settings = get_settings()


async def extract_text_from_image(image_bytes: bytes, filename: str = "") -> str:
    """Extract text from an image using pytesseract or Google Vision."""
    if settings.USE_GOOGLE_VISION and settings.GOOGLE_VISION_KEY:
        return await _extract_google_vision(image_bytes)
    return await _extract_tesseract(image_bytes)


async def _extract_tesseract(image_bytes: bytes) -> str:
    """pytesseract OCR — runs locally, no API cost."""
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(img, config="--psm 6")
        return text.strip()
    except ImportError:
        return "[OCR unavailable — install pytesseract and Tesseract binary]"
    except Exception as e:
        return f"[OCR failed: {str(e)}]"


async def _extract_google_vision(image_bytes: bytes) -> str:
    """Google Vision API OCR — higher accuracy for poor scans."""
    import httpx
    b64 = base64.b64encode(image_bytes).decode()
    url = f"https://vision.googleapis.com/v1/images:annotate?key={settings.GOOGLE_VISION_KEY}"
    payload = {
        "requests": [{
            "image": {"content": b64},
            "features": [{"type": "TEXT_DETECTION"}]
        }]
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        annotations = data.get("responses", [{}])[0].get("textAnnotations", [])
        if annotations:
            return annotations[0].get("description", "").strip()
        return ""


async def extract_evidence_text(files: dict[str, bytes]) -> dict[str, str]:
    """
    Process all uploaded evidence files and return extracted text per file type.
    
    files = {
        "tracking": bytes,
        "chat_logs": bytes,
        "tos": bytes,
        "product_photos": [bytes, ...]
    }
    """
    extracted = {}

    for evidence_type, file_bytes in files.items():
        if isinstance(file_bytes, list):
            texts = []
            for fb in file_bytes:
                text = await extract_text_from_image(fb)
                if text:
                    texts.append(text)
            extracted[evidence_type] = " | ".join(texts)
        elif file_bytes:
            extracted[evidence_type] = await extract_text_from_image(file_bytes)

    return extracted


def parse_tracking_from_text(text: str) -> dict:
    """Attempt to extract key tracking facts from OCR text."""
    import re
    result = {}

    # Delivery status
    delivery_patterns = ["delivered", "package delivered", "out for delivery", "attempted delivery"]
    for p in delivery_patterns:
        if p.lower() in text.lower():
            result["delivery_status"] = p.title()
            break

    # Dates (MM/DD/YYYY or Month DD, YYYY)
    date_match = re.findall(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', text)
    if date_match:
        result["dates_found"] = date_match

    # Tracking numbers (common formats)
    tracking_patterns = [
        r'\b1Z[A-Z0-9]{16}\b',           # UPS
        r'\b\d{22}\b',                     # USPS
        r'\b[0-9]{12,15}\b',              # FedEx
        r'\bJD\d{18}\b',                  # DHL
    ]
    for pattern in tracking_patterns:
        match = re.search(pattern, text)
        if match:
            result["tracking_number"] = match.group()
            break

    return result
