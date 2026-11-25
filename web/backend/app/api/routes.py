import asyncio
import time
from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
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
_FEEDBACK_LOCKS: dict[str, asyncio.Lock] = {}
_COMPANY_LOCKS: dict[str, asyncio.Lock] = {}
_ALLOWED_PERSONAS = {"analytical", "challenging", "conversational"}
_ALLOWED_CONFIDENCE = {"low", "medium", "high"}


def _coerce_time_limit(raw: object) -> int:
    try:
        val = int(raw)  # type: ignore[arg-type]
        return max(60, min(1800, val))
    except (TypeError, ValueError):
        return 300


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

    persona = req.persona.strip().lower()
    if persona not in _ALLOWED_PERSONAS:
        persona = "analytical"

    rigor_level = max(1, min(5, req.rigorLevel))

    def _create_initial_session():
        resolved_skills = [s.strip() for s in req.skills if s.strip()]
        if not resolved_skills:
            latest_resume = (
                db.query(Resume)
                .filter(Resume.user_id == current_user.id)
                .order_by(Resume.uploaded_at.desc())
                .first()
            )
            if latest_resume and isinstance(latest_resume.skills, list):
                resolved_skills = latest_resume.skills

        new_session = InterviewSession(
            user_id=current_user.id,
            role=role,
            company=company,
            persona=persona,
            rigor_level=rigor_level,
            duration=0,
            status="setup",
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        return new_session, resolved_skills

    session, skills = await run_in_threadpool(_create_initial_session)

    try:
        ai_questions = await ai_service.generate_interview_questions(
            role=role,
            company=company,
            persona=persona,
            rigor_level=rigor_level,
            skills=skills,
            num_questions=5,
        )
    except Exception:
        def _cleanup_failed_session():
            db.delete(session)
            db.commit()

        await run_in_threadpool(_cleanup_failed_session)
        raise

    def _save_questions():
        for i, q in enumerate(ai_questions):
            question = Question(
                session_id=session.id,
                category=str(q.get("category") or "General"),
                text=str(q.get("text") or "Tell me about yourself."),
                sub_prompt=q.get("sub_prompt"),
                time_limit=_coerce_time_limit(q.get("time_limit")),
                order_num=i + 1,
            )
            db.add(question)

        session.status = "active"
        db.commit()

    await run_in_threadpool(_save_questions)

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

    confidence = req.confidence.strip().lower()
    if confidence not in _ALLOWED_CONFIDENCE:
        confidence = "medium"

    def _load_q_and_session():
        q = db.query(Question).filter(Question.id == question_id).first()
        if not q:
            return None, None
        s = db.query(InterviewSession).filter(
            InterviewSession.id == q.session_id,
            InterviewSession.user_id == current_user.id,
        ).first()
        return q, s

    question, session = await run_in_threadpool(_load_q_and_session)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
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

    def _upsert_answer():
        existing_answer = db.query(Answer).filter(Answer.question_id == question_id).first()
        if existing_answer:
            existing_answer.text = req.text
            existing_answer.confidence = confidence
            existing_answer.duration = duration_seconds
            existing_answer.score = evaluation.get("score")
            existing_answer.feedback_text = evaluation.get("feedback", "")
            ans = existing_answer
        else:
            ans = Answer(
                question_id=question_id,
                text=req.text,
                confidence=confidence,
                duration=duration_seconds,
                score=evaluation.get("score"),
                feedback_text=evaluation.get("feedback", ""),
            )
            db.add(ans)
        db.commit()
        return ans.score

    saved_score = await run_in_threadpool(_upsert_answer)

    return {
        "status": "submitted",
        "score": saved_score,
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
    lock = _FEEDBACK_LOCKS.setdefault(session_id, asyncio.Lock())
    try:
        async with lock:
            def _load_session_and_existing():
                sess = db.query(InterviewSession).filter(
                    InterviewSession.id == session_id,
                    InterviewSession.user_id == current_user.id,
                ).first()
                if not sess:
                    return None, None, []
                rep = (
                    db.query(FeedbackReport)
                    .filter(FeedbackReport.session_id == session_id)
                    .order_by(FeedbackReport.created_at.desc())
                    .first()
                )
                if rep:
                    return sess, rep, []

                qs = db.query(Question).filter(Question.session_id == session_id).order_by(Question.order_num).all()
                q_ids = [q.id for q in qs]
                ans = db.query(Answer).filter(Answer.question_id.in_(q_ids)).all() if q_ids else []
                return sess, None, (qs, ans)

            session, existing_report, qa_data = await run_in_threadpool(_load_session_and_existing)

            if not session:
                raise HTTPException(status_code=404, detail="Session not found")

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

            questions, answers = qa_data
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

            feedback = await ai_service.generate_session_feedback(
                questions_and_answers=qa_pairs,
                role=session.role,
                company=session.company,
                rigor_level=session.rigor_level,
                persona=session.persona,
            )

            total_seconds = sum((a.duration or 0) for a in answers)

            def _save_feedback():
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
                session.score = feedback.get("overallScore", 0)
                session.status = "completed"
                session.duration = total_seconds
                db.commit()

            await run_in_threadpool(_save_feedback)

            return {
                "sessionId": session_id,
                **feedback,
            }
    finally:
        if not lock.locked():
            _FEEDBACK_LOCKS.pop(session_id, None)


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
    lock = _COMPANY_LOCKS.setdefault(cache_key, asyncio.Lock())
    try:
        async with lock:
            now = time.monotonic()
            cached = _COMPANY_CACHE.get(cache_key)
            if cached and (now - cached[0]) < _COMPANY_CACHE_TTL_SECONDS:
                return {**cached[1], "isFallback": False}

            prep = await ai_service.generate_company_prep(clean_name)

            if len(_COMPANY_CACHE) >= _COMPANY_CACHE_MAX_ENTRIES:
                oldest_key = next(iter(_COMPANY_CACHE))
                _COMPANY_CACHE.pop(oldest_key, None)
            _COMPANY_CACHE[cache_key] = (now, prep)

            return {**prep, "isFallback": False}
    finally:
        if not lock.locked():
            _COMPANY_LOCKS.pop(cache_key, None)
