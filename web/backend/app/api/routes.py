import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.models.models import InterviewSession, Question, Answer, Resume, User, FeedbackReport
from app.auth.routes import get_current_user
from app.services import ai_service

router = APIRouter()

_COMPANY_CACHE: dict[str, tuple[float, dict]] = {}
_COMPANY_CACHE_TTL_SECONDS = 3600
_COMPANY_CACHE_MAX_ENTRIES = 100


class SetupRequest(BaseModel):
    role: str
    company: str
    persona: str
    rigorLevel: int
    skills: list[str] = []


class AnswerRequest(BaseModel):
    text: str
    confidence: str
    duration: int


@router.post("/setup")
async def setup_interview(
    req: SetupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = req.role.strip()
    company = req.company.strip()
    if not role or not company:
        raise HTTPException(status_code=400, detail="Role and company are required.")

    rigor_level = max(1, min(5, req.rigorLevel))

    # Fall back to latest uploaded resume skills if client didn't pass any
    skills = [s.strip() for s in req.skills if s.strip()]
    if not skills:
        latest_resume = (
            db.query(Resume)
            .filter(Resume.user_id == current_user.id)
            .order_by(Resume.uploaded_at.desc())
            .first()
        )
        if latest_resume and isinstance(latest_resume.skills, list):
            skills = latest_resume.skills

    session = InterviewSession(
        user_id=current_user.id,
        role=role,
        company=company,
        persona=req.persona,
        rigor_level=rigor_level,
        duration=0,
        status="setup",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    try:
        ai_questions = await ai_service.generate_interview_questions(
            role=role,
            company=company,
            persona=req.persona,
            rigor_level=rigor_level,
            skills=skills,
            num_questions=5,
        )
    except Exception:
        # Clean up orphaned setup session if AI generation fails
        db.delete(session)
        db.commit()
        raise

    for i, q in enumerate(ai_questions):
        question = Question(
            session_id=session.id,
            category=q.get("category", "General"),
            text=q.get("text", "Tell me about yourself."),
            sub_prompt=q.get("sub_prompt"),
            time_limit=q.get("time_limit", 300),
            order_num=i + 1,
        )
        db.add(question)

    session.status = "active"
    db.commit()

    return {"sessionId": session.id, "status": "active", "questionCount": len(ai_questions)}


@router.get("/{session_id}/questions")
def get_questions(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    questions = db.query(Question).filter(Question.session_id == session_id).order_by(Question.order_num).all()

    return [
        {
            "id": q.id,
            "category": q.category,
            "text": q.text,
            "subPrompt": q.sub_prompt,
            "timeLimit": q.time_limit,
            "order": q.order_num,
        }
        for q in questions
    ]


@router.post("/answer/{question_id}")
async def submit_answer(
    question_id: str,
    req: AnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Answer text cannot be empty")

    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    session = db.query(InterviewSession).filter(
        InterviewSession.id == question.session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=403, detail="Access denied")

    evaluation = await ai_service.evaluate_answer(
        question=question.text,
        answer=req.text,
        role=session.role,
        company=session.company,
        rigor_level=session.rigor_level,
        persona=session.persona,
    )

    duration_seconds = max(0, req.duration)
    existing_answer = db.query(Answer).filter(Answer.question_id == question_id).first()
    if existing_answer:
        existing_answer.text = req.text
        existing_answer.confidence = req.confidence
        existing_answer.duration = duration_seconds
        existing_answer.score = evaluation.get("score")
        existing_answer.feedback_text = evaluation.get("feedback", "")
        answer = existing_answer
    else:
        answer = Answer(
            question_id=question_id,
            text=req.text,
            confidence=req.confidence,
            duration=duration_seconds,
            score=evaluation.get("score"),
            feedback_text=evaluation.get("feedback", ""),
        )
        db.add(answer)

    db.commit()

    return {
        "status": "submitted",
        "score": answer.score,
        "feedback": evaluation.get("feedback", ""),
        "strengths": evaluation.get("strengths", []),
        "improvements": evaluation.get("improvements", []),
    }


@router.get("/{session_id}/feedback")
async def get_feedback(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 1. Check if feedback already exists in DB
    existing_report = (
        db.query(FeedbackReport)
        .filter(FeedbackReport.session_id == session_id)
        .order_by(FeedbackReport.created_at.desc())
        .first()
    )
    if existing_report:
        return {
            "sessionId": session_id,
            "overallScore": existing_report.overall_score,
            "overallAssessment": existing_report.overall_assessment,
            "strengths": existing_report.strengths,
            "improvements": existing_report.improvements,
            "recommendedActions": existing_report.recommended_actions,
            "vocalConfidenceData": existing_report.vocal_confidence_data or [],
        }

    # 2. Gather questions and answers for AI analysis
    questions = db.query(Question).filter(Question.session_id == session_id).order_by(Question.order_num).all()
    question_ids = [q.id for q in questions]
    answers = db.query(Answer).filter(Answer.question_id.in_(question_ids)).all() if question_ids else []
    answer_map = {a.question_id: a for a in answers}

    qa_pairs = []
    for q in questions:
        answer = answer_map.get(q.id)
        qa_pairs.append({
            "category": q.category,
            "question": q.text,
            "answer": answer.text if answer else "No answer provided.",
            "answered": answer is not None,
            "confidence": answer.confidence if answer else "low",
            "duration": answer.duration if answer else 0,
            "score": answer.score if answer else None,
        })

    # 3. Generate AI feedback
    feedback = await ai_service.generate_session_feedback(
        questions_and_answers=qa_pairs,
        role=session.role,
        company=session.company,
        rigor_level=session.rigor_level,
        persona=session.persona,
    )

    # 4. Save to Database
    new_report = FeedbackReport(
        session_id=session_id,
        overall_score=feedback.get("overallScore", 0),
        overall_assessment=feedback.get("overallAssessment", ""),
        strengths=feedback.get("strengths", []),
        improvements=feedback.get("improvements", []),
        recommended_actions=feedback.get("recommendedActions", []),
        vocal_confidence_data=feedback.get("vocalConfidenceData", []),
    )
    db.add(new_report)

    # 5. Update Session Status, Score, and Duration (in seconds)
    session.score = feedback.get("overallScore", 0)
    session.status = "completed"
    session.duration = sum((a.duration or 0) for a in answers)

    db.commit()

    return {
        "sessionId": session_id,
        **feedback,
    }


@router.get("/company/{company_name}")
async def get_company_prep(
    company_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    clean_name = company_name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Company name is required")

    cache_key = clean_name.lower()
    now = time.monotonic()
    cached = _COMPANY_CACHE.get(cache_key)
    if cached and (now - cached[0]) < _COMPANY_CACHE_TTL_SECONDS:
        return {**cached[1], "isFallback": True}

    prep = await ai_service.generate_company_prep(clean_name)

    if len(_COMPANY_CACHE) >= _COMPANY_CACHE_MAX_ENTRIES:
        oldest_key = next(iter(_COMPANY_CACHE))
        _COMPANY_CACHE.pop(oldest_key, None)
    _COMPANY_CACHE[cache_key] = (now, prep)

    return {**prep, "isFallback": False}
