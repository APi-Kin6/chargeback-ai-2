from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data model to match your new Frontend fields
class DisputeRequest(BaseModel):
    platform: str
    region: str
    reasonCode: str
    claimDetails: str
    pastSuccessContext: str = ""
    email: str = ""

@app.post("/api/generate")
async def generate_dispute(request: DisputeRequest):
    try:
        # This is where the "Value-Add" happens. 
        # We construct a highly specific prompt based on the user's laws and platform.
        prompt = f"""
        Generate a professional legal dispute defense letter for a chargeback on {request.platform}.
        Jurisdiction: {request.region}.
        Reason Code: {request.reasonCode}.
        
        Customer Claim: {request.claimDetails}
        
        Context of previous successful defenses: {request.pastSuccessContext}
        
        Requirements:
        1. Cite relevant {request.platform} merchant policies.
        2. Reference consumer protection laws applicable in {request.region}.
        3. Maintain a firm, professional, and evidence-based tone.
        """
        
        # For now, we return a structured placeholder. 
        # Once your Anthropic Key is live, this will call the LLM.
        generated_letter = f"DEFENSE DRAFT FOR: {request.email}\n\n" \
                           f"Subject: Formal Rebuttal of Chargeback {request.reasonCode} on {request.platform}\n\n" \
                           f"This letter serves as a formal response to the dispute filed in {request.region}... [AI will fill this based on your prompt]"
        
        return {"letter": generated_letter}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health():
    return {"status": "online"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)