import json
import os
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.services import ai_service
from app.services.ai_service import AIProviderError
from app.auth.routes import get_current_user, router as auth_router
from app.resume.routes import router as resume_router
from app.api.routes import router as interview_router
from app.analytics.routes import router as analytics_router
from app.db.database import init_db
from app.models.models import User


def _init_firebase():
    """Initialize Firebase Admin SDK safely once."""
    import firebase_admin
    from firebase_admin import credentials

    if firebase_admin._apps:
        print("[PrepMate] Firebase Admin already initialized, skipping.")
        return

    service_account_path = "firebase-service-account.json"
    service_account_env = os.getenv("FIREBASE_SERVICE_ACCOUNT")

    if os.path.exists(service_account_path):
        try:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            print("[PrepMate] Firebase Admin initialized from file.")
        except ValueError:
            print("[PrepMate] Firebase Admin already initialized.")
    elif service_account_env:
        try:
            service_account_info = json.loads(service_account_env)
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred)
            print("[PrepMate] Firebase Admin initialized from environment variable.")
        except ValueError:
            print("[PrepMate] Firebase Admin already initialized.")
        except Exception as e:
            print(f"[PrepMate] Failed to initialize Firebase from environment variable: {e}")
    else:
        print("[PrepMate] Firebase Service Account not found. Firebase auth disabled.")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    _init_firebase()
    yield


app = FastAPI(
    title="PrepMate AI API",
    description="Adaptive Interview Preparation Platform API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.exception_handler(AIProviderError)
async def ai_provider_exception_handler(request, exc: AIProviderError):
    return JSONResponse(
        status_code=503,
        content={"message": "AI Service Unavailable", "detail": str(exc)},
    )


@app.get("/")
async def root():
    return {"message": "PrepMate AI API is running", "version": "1.0.0"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/ai/status")
async def ai_provider_status():
    """Return passive AI provider configuration status without burning external API quota."""
    key_map = {
        "gemini": bool(settings.GEMINI_API_KEY),
        "groq": bool(settings.GROQ_API_KEY),
        "openrouter": bool(settings.OPENROUTER_API_KEY),
        "cerebras": bool(settings.CEREBRAS_API_KEY),
    }
    providers = {
        name: {"status": "configured" if configured else "skipped"}
        for name, configured in key_map.items()
    }
    configured_count = sum(1 for v in key_map.values() if v)
    return {
        "stack_order": ["gemini", "groq", "openrouter", "cerebras"],
        "working_count": configured_count,
        "providers": providers,
    }


@app.get("/api/ai/status/probe")
async def ai_provider_probe(_current_user: User = Depends(get_current_user)):
    """Authenticated live health check for all AI providers in the fallback stack."""
    results = await ai_service.check_providers()
    working = [name for name, info in results.items() if info["status"] == "ok"]
    return {
        "stack_order": ["gemini", "groq", "openrouter", "cerebras"],
        "working_count": len(working),
        "providers": results,
    }


# Include Routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(resume_router, prefix="/api/resume", tags=["Resume"])
app.include_router(interview_router, prefix="/api/interview", tags=["Interview"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
