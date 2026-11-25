import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.models.models import Resume, User
from app.auth.routes import get_current_user
from app.core.config import settings
from app.resume.parser import extract_docx_text, extract_pdf_text, extract_skills
from app.services.ai_service import analyze_resume, analyze_job_match

router = APIRouter()


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.size and file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")

    safe_filename = os.path.basename(file.filename or "").strip()
    ext = os.path.splitext(safe_filename)[1].lower()
    if not safe_filename or ext not in (".pdf", ".docx"):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")

    parsed_text_str = ""
    if ext == ".pdf":
        try:
            parsed_text_str = await run_in_threadpool(extract_pdf_text, content)
        except Exception:
            raise HTTPException(status_code=422, detail="Failed to parse PDF document.")
    elif ext == ".docx":
        try:
            parsed_text_str = await run_in_threadpool(extract_docx_text, content)
        except Exception:
            raise HTTPException(status_code=422, detail="Failed to parse DOCX document.")

    if not parsed_text_str.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract readable text from file. Ensure it is not an image-only scan.",
        )

    # Save file safely using a UUID filename inside UPLOAD_DIR
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    disk_filename = f"{current_user.id}_{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, disk_filename)
    with open(file_path, "wb") as f:
        f.write(content)

    extracted_skills = extract_skills(parsed_text_str)

    resume = Resume(
        user_id=current_user.id,
        file_name=safe_filename,
        file_path=file_path,
        file_size=len(content),
        skills=extracted_skills,
        experience=[],
        parsed_text=parsed_text_str,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return {
        "id": resume.id,
        "fileName": resume.file_name,
        "fileSize": f"{len(content) / 1024 / 1024:.1f} MB",
        "fileSizeBytes": len(content),
        "skills": resume.skills,
        "uploadedAt": resume.uploaded_at.isoformat(),
    }


@router.get("/latest")
def get_latest_resume(
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
        return {"resume": None}

    valid_analysis = (
        resume.analysis
        if isinstance(resume.analysis, dict) and not resume.analysis.get("error")
        else None
    )
    return {
        "resume": {
            "id": resume.id,
            "fileName": resume.file_name,
            "fileSizeBytes": resume.file_size,
            "skills": resume.skills or [],
            "analysis": valid_analysis,
            "uploadedAt": resume.uploaded_at.isoformat() if resume.uploaded_at else None,
        }
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


class MatchRequest(BaseModel):
    jobDescription: str


@router.post("/analyze/{resume_id}")
async def run_resume_analysis(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not resume.parsed_text:
        raise HTTPException(status_code=400, detail="Resume text could not be parsed previously")

    # Return cached analysis only if it is valid (ignore historical error payloads)
    if isinstance(resume.analysis, dict) and not resume.analysis.get("error"):
        return resume.analysis

    analysis_result = await analyze_resume(resume.parsed_text)
    resume.analysis = analysis_result
    db.commit()

    return analysis_result


@router.post("/match/{resume_id}")
async def match_resume_to_job(
    resume_id: str,
    req: MatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not resume.parsed_text:
        raise HTTPException(status_code=400, detail="Resume text could not be parsed previously")

    if not req.jobDescription.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty")

    match_result = await analyze_job_match(resume.parsed_text, req.jobDescription)
    return match_result


@router.delete("/{resume_id}")
def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.file_path:
        upload_root = os.path.abspath(settings.UPLOAD_DIR)
        abs_path = os.path.abspath(resume.file_path)
        if abs_path.startswith(upload_root + os.sep) and os.path.exists(abs_path):
            try:
                os.remove(abs_path)
            except OSError:
                pass

    db.delete(resume)
    db.commit()
    return {"status": "deleted", "id": resume_id}
