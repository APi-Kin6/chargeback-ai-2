# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Internal imports
from backend.config import settings
from backend.routers import webhook, auth, disputes
from backend.database import engine, Base

# Set up database tables on startup
Base.metadata.create_all(bind=engine)

# Logging configuration for Render
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# ── CORS Configuration (Allow frontend to connect) ──
app.add_middleware(
    CORSMiddleware,
    # In production, change this to your static site URL: 
    # ['https://chargeback-defender.onrender.com']
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include Routers ──
app.include_router(auth.router)
app.include_router(disputes.router)
# Ensure your webhook router is included
app.include_router(webhook.router)

@app.get("/api/health")
def health_check():
    """Simple endpoint for Render to verify the service is running."""
    logger.info("Health check endpoint hit.")
    return {"status": "healthy", "service": settings.APP_NAME}

@app.get("/")
def read_root():
    """Redirect users to the API documentation."""
    return {"message": f"Welcome to {settings.APP_NAME}. Please visit /api/docs for the documentation."}