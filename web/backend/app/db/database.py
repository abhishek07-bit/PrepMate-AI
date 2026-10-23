import re
from urllib.parse import quote, unquote
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings


def _sanitize_db_url(url: str) -> str:
    """Normalize and sanitize database URL for SQLAlchemy and psycopg."""
    if not url or "sqlite" in url:
        return url

    # Handle SQLAlchemy 1.4+ requirement for "postgresql://" prefix
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    # Sanitize password with unencoded special characters and strip accidental leading '@' in host
    match = re.match(r"^(?P<prefix>[a-zA-Z0-9+]+://)(?P<credentials>.+)@+(?P<host>[a-zA-Z0-9.-]+)(?P<rest>.*)$", url)
    if match:
        prefix = match.group("prefix")
        creds = match.group("credentials")
        host = match.group("host")
        rest = match.group("rest")

        if ":" in creds:
            user, raw_pass = creds.split(":", 1)
            encoded_pass = quote(unquote(raw_pass), safe="")
            url = f"{prefix}{user}:{encoded_pass}@{host}{rest}"
        else:
            url = f"{prefix}{creds}@{host}{rest}"

    # Dynamically route to installed driver (psycopg v3 or psycopg2 v2)
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        try:
            import psycopg  # noqa
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        except ImportError:
            try:
                import psycopg2  # noqa
                url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
            except ImportError:
                pass

    return url


db_url = _sanitize_db_url(settings.DATABASE_URL)

engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False} if "sqlite" in db_url else {},
    pool_pre_ping=True,  # Test connections before using them
    pool_recycle=3600,   # Recycle connections every hour
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Import all models here so metadata is populated
    try:
        from app.models import models  # noqa
        Base.metadata.create_all(bind=engine)
        print("[PrepMate DB] Database initialized successfully.")
    except Exception as e:
        print(f"[PrepMate DB] Warning: Could not initialize database tables: {e}")
