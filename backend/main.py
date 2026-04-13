from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.database import init_db
from backend.routers import auth_router, disputes, webhook

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="ChargebackDefender API",
    description="AI-powered chargeback dispute letter generator for e-commerce sellers",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://chargeback-defender.onrender.com",
        "https://your-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(disputes.router)
app.include_router(webhook.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": settings.APP_NAME}


@app.get("/")
async def root():
    return {"message": "ChargebackDefender API", "docs": "/api/docs"}
