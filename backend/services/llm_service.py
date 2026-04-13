"""
LLM Service — Anthropic Claude for dispute letter generation.
Uses structured prompting aligned to Visa/MC arbitration framework.
"""
import json
from anthropic import AsyncAnthropic
from backend.config import get_settings

settings = get_settings()
client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

# Reason code database — maps code to dispute category and required evidence
REASON_CODE_MAP = {
    # Visa Codes
    "4853": {
        "label": "Cardholder Dispute – Not as Described / Defective",
        "category": "merchandise",
        "required_evidence": [
            "Product description matching listing",
            "Photos proving item matches description",
            "Customer communication showing no complaint before dispute",
            "Refund/return policy (ToS acceptance)",
            "Delivery confirmation",
        ],
        "rebuttal_angle": "Prove product matched description and buyer had remedy options they didn't use.",
    },
    "4855": {
        "label": "Non-Receipt of Merchandise",
        "category": "non_delivery",
        "required_evidence": [
            "Tracking number with carrier confirmation of delivery",
            "Delivery address matches cardholder",
            "Signature confirmation (if >$750)",
            "Proof of digital delivery (if applicable)",
        ],
        "rebuttal_angle": "Carrier proof of delivery is primary. Show delivery to address on file.",
    },
    "13.1": {
        "label": "Mastercard – Merchandise/Services Not Received",
        "category": "non_delivery",
        "required_evidence": [
            "Proof of delivery with carrier tracking",
            "Customer communication history",
            "Order confirmation sent to billing address",
        ],
        "rebuttal_angle": "Document all delivery attempts and confirmation events.",
    },
    "13.3": {
        "label": "Mastercard – Not as Described",
        "category": "merchandise",
        "required_evidence": [
            "Product listing screenshots",
            "Photos of shipped item",
            "Communication showing no complaints before dispute",
            "ToS and return policy acceptance",
        ],
        "rebuttal_angle": "Show listing accuracy and lack of pre-dispute complaints.",
    },
    "UA02": {
        "label": "PayPal – Unauthorized Transaction / Fraud",
        "category": "fraud",
        "required_evidence": [
            "IP address of purchase",
            "Device fingerprint data",
            "Login history showing account access",
            "Delivery to account-registered address",
            "Previous successful orders from same account",
        ],
        "rebuttal_angle": "Demonstrate transaction was authorized using behavioral and technical evidence.",
    },
    "R13": {
        "label": "No Reply to Retrieval Request",
        "category": "procedural",
        "required_evidence": [
            "Order confirmation",
            "Proof of delivery",
            "Any customer communication",
        ],
        "rebuttal_angle": "Respond with full evidence package immediately.",
    },
}

PLATFORM_INSTRUCTIONS = {
    "shopify": "Submit via Shopify Admin → Orders → [Order] → Dispute. Upload PDF evidence directly.",
    "etsy": "Submit via Etsy Seller Dashboard → Cases & Disputes → Respond with evidence uploads.",
    "amazon": "Submit via Seller Central → Performance → A-to-z Guarantee Claims → Respond.",
    "paypal": "Submit via PayPal Resolution Center → View dispute → Provide information.",
    "stripe": "Submit via Stripe Dashboard → Disputes → [Dispute ID] → Submit evidence before deadline.",
}


async def generate_dispute_letter(
    platform: str,
    reason_code: str,
    order_id: str,
    order_date: str,
    dispute_amount: float,
    product_description: str,
    delivery_confirmation: str,
    extracted_evidence: dict,
    seller_name: str = "The Seller",
) -> dict:
    """
    Generate a complete dispute rebuttal package using Claude.
    Returns: { letter, evidence_checklist, win_probability, win_explanation }
    """
    code_info = REASON_CODE_MAP.get(reason_code, {
        "label": f"Dispute Code {reason_code}",
        "category": "general",
        "required_evidence": ["Order proof", "Delivery confirmation", "Customer communications"],
        "rebuttal_angle": "Provide comprehensive evidence of legitimate transaction.",
    })

    evidence_summary = json.dumps(extracted_evidence, indent=2) if extracted_evidence else "No OCR evidence extracted."

    system_prompt = """You are a chargeback dispute specialist with 15 years of experience winning 
disputes for e-commerce sellers against Visa, Mastercard, and PayPal arbitration.

You write formal, precise dispute rebuttal letters that follow the exact structure 
required by card network arbitration rules. Your letters are:
- Professional and direct (no emotional language)
- Evidence-first (lead with facts, not opinion)  
- Structured in the exact format processors expect
- Targeted to the specific reason code's rebuttal requirements

You ALWAYS respond with valid JSON only, no markdown, no preamble."""

    user_prompt = f"""Generate a complete dispute rebuttal package for this chargeback.

DISPUTE DETAILS:
- Platform: {platform.upper()}
- Reason Code: {reason_code} — {code_info['label']}
- Order ID: {order_id or 'N/A'}
- Order Date: {order_date or 'N/A'}
- Disputed Amount: ${dispute_amount:.2f}
- Product: {product_description or 'Not provided'}
- Delivery Confirmation: {delivery_confirmation or 'Not provided'}
- Seller Name: {seller_name}

REBUTTAL STRATEGY: {code_info['rebuttal_angle']}

EXTRACTED EVIDENCE FROM UPLOADS:
{evidence_summary}

REQUIRED EVIDENCE FOR {reason_code}: {', '.join(code_info['required_evidence'])}

Generate a JSON response with EXACTLY these keys:
{{
  "dispute_letter": "Complete formal dispute letter text (500-900 words). Structure: 
    [1] Header with date, dispute ID, amount
    [2] Opening statement of position
    [3] Transaction summary paragraph  
    [4] Evidence Summary section (numbered list)
    [5] Point-by-Point Rebuttal addressing the specific reason code
    [6] Conclusion demanding reversal
    [7] Signature block",
  
  "evidence_checklist": {{
    "provided": ["list of evidence items present in this submission"],
    "missing": ["list of evidence items that would strengthen the case"],
    "critical_missing": ["evidence items whose absence significantly weakens the case"]
  }},
  
  "win_probability": 0.0,  // Float 0.0-1.0
  
  "win_probability_explanation": "2-3 sentence explanation of score, what helps, what hurts",
  
  "submission_instructions": "Platform-specific instructions for where/how to submit this",
  
  "deadline_warning": "Note about typical response window for this platform/processor"
}}"""

    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw = message.content[0].text.strip()

    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    result = json.loads(raw)

    # Append platform instructions
    if platform.lower() in PLATFORM_INSTRUCTIONS:
        result["submission_instructions"] = PLATFORM_INSTRUCTIONS[platform.lower()]

    return result


async def get_evidence_checklist(reason_code: str) -> dict:
    """Return the required evidence checklist for a reason code (pre-submission)."""
    code_info = REASON_CODE_MAP.get(reason_code, {})
    return {
        "reason_code": reason_code,
        "label": code_info.get("label", "Unknown"),
        "required_evidence": code_info.get("required_evidence", []),
        "rebuttal_angle": code_info.get("rebuttal_angle", ""),
    }
