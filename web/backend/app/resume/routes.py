from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import os

from app.db.database import get_db
from app.models.models import Resume, User
from app.auth.routes import get_current_user
from app.core.config import settings

router = APIRouter()


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.size and file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")

    if not file.filename or not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")

    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, f"{current_user.id}_{file.filename}")
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Parse skills (placeholder)
    extracted_skills = ["Python", "React", "System Design", "Agile", "SQL", "Docker"]

    resume = Resume(
        user_id=current_user.id,
        file_name=file.filename,
        file_path=file_path,
        file_size=len(content),
        skills=extracted_skills,
        experience=[],
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return {
        "id": resume.id,
        "fileName": resume.file_name,
        "fileSize": f"{len(content) / 1024 / 1024:.1f} MB",
        "skills": resume.skills,
        "uploadedAt": resume.uploaded_at.isoformat(),
    }


@router.get("/skills")
def get_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
        .first()
    )
    if not resume:
        return {"skills": [], "message": "No resume uploaded yet"}

    return {"skills": resume.skills, "fileName": resume.file_name}
