from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import uuid
import re

from app.db.database import get_db
from app.models.models import Resume, User, format_utc_iso
from app.core.config import settings

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class RegisterRequest(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "createdAt": format_utc_iso(user.created_at),
    }


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _is_firebase_initialized() -> bool:
    """Check if Firebase Admin SDK is initialized without importing at module level."""
    try:
        import firebase_admin
        return bool(firebase_admin._apps)
    except ImportError:
        return False


def _split_display_name(display_name: str, fallback_email: str) -> tuple[str, str]:
    parts = (display_name or "").strip().split()
    if len(parts) >= 2:
        return parts[0], " ".join(parts[1:])
    if len(parts) == 1:
        return parts[0], ""
    return fallback_email.split("@")[0], ""


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user_id = None
    email = None
    display_name = ""
    email_verified = False

    # 1. Try Firebase Verification — only if Firebase is initialized
    if _is_firebase_initialized():
        try:
            from firebase_admin import auth as firebase_auth
            decoded_token = await run_in_threadpool(firebase_auth.verify_id_token, token)
            user_id = decoded_token.get("uid")
            raw_email = decoded_token.get("email")
            email = raw_email.strip().lower() if isinstance(raw_email, str) and raw_email.strip() else None
            display_name = decoded_token.get("name") or ""
            email_verified = bool(decoded_token.get("email_verified", False))
        except Exception:
            # Firebase verification failed, fall through to local JWT
            pass

    # 2. Fallback to Local JWT if Firebase didn't authenticate
    if user_id is None:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    def _resolve_or_prepare_user():
        found = db.query(User).filter(User.id == user_id).first()
        if found is not None:
            return found, None
        if email:
            existing_by_email = db.query(User).filter(User.email == email).first()
            if existing_by_email is not None:
                if not email_verified:
                    raise HTTPException(
                        status_code=403,
                        detail="Please verify your email address before accessing this account.",
                    )
                return existing_by_email, None
            return None, email
        return None, None

    user, jit_email = await run_in_threadpool(_resolve_or_prepare_user)

    # 3. Just-in-time user creation (for Social Login / Firebase users)
    if user is None and jit_email:
        random_pass = str(uuid.uuid4()) + "SOCIAL_LOGIN"
        hashed_pass = await run_in_threadpool(pwd_context.hash, random_pass)
        first_name, last_name = _split_display_name(display_name, jit_email)

        def _create_jit_user():
            new_user = User(
                id=user_id,
                email=jit_email,
                hashed_password=hashed_pass,
                first_name=first_name,
                last_name=last_name,
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return new_user

        user = await run_in_threadpool(_create_jit_user)

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user


@router.post("/register")
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    if not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    if len(req.password) < 8 or not re.search(r"[A-Za-z]", req.password) or not re.search(r"\d", req.password):
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long and contain both letters and numbers.")

    first_name = req.firstName.strip()
    last_name = req.lastName.strip()
    if not first_name:
        raise HTTPException(status_code=400, detail="First name is required.")

    existing = await run_in_threadpool(lambda: db.query(User).filter(User.email == email).first())
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pass = await run_in_threadpool(pwd_context.hash, req.password)

    def _create_user():
        new_user = User(
            email=email,
            hashed_password=hashed_pass,
            first_name=first_name,
            last_name=last_name,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    user = await run_in_threadpool(_create_user)

    token = create_access_token({"sub": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _serialize_user(user),
    }


@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = await run_in_threadpool(lambda: db.query(User).filter(User.email == email).first())
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    is_valid = await run_in_threadpool(pwd_context.verify, req.password, user.hashed_password)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _serialize_user(user),
    }


class UpdateProfileRequest(BaseModel):
    firstName: str
    lastName: str


@router.put("/update-profile")
def update_profile(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    first_name = req.firstName.strip()
    last_name = req.lastName.strip()
    if not first_name:
        raise HTTPException(status_code=400, detail="First name cannot be empty.")

    # Re-query user in the active db session to avoid detached instance issues
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.first_name = first_name
    user.last_name = last_name
    db.commit()
    db.refresh(user)
    return _serialize_user(user)


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return _serialize_user(current_user)


@router.delete("/me")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently delete the authenticated user and all associated data."""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    upload_root = os.path.abspath(settings.UPLOAD_DIR)
    resumes = db.query(Resume).filter(Resume.user_id == user.id).all()
    for r in resumes:
        if r.file_path:
            abs_path = os.path.abspath(r.file_path)
            if abs_path.startswith(upload_root + os.sep) and os.path.exists(abs_path):
                try:
                    os.remove(abs_path)
                except OSError:
                    pass

    db.delete(user)
    db.commit()
    return {"status": "deleted"}
