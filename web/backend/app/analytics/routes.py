from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User, InterviewSession
from app.auth.routes import get_current_user

router = APIRouter()


@router.get("/readiness")
def get_readiness(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Mock for now, could be calculated from sessions
    return {"readinessScore": 68, "trend": 4, "criticalGaps": 3, "avgResolutionTime": "42m"}


@router.get("/weaknesses")
def get_weaknesses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Mock for now
    return {"topics": [
        {"name": "Dynamic Programming (2D)", "description": "Consistent failure in identifying overlapping subproblems.", "severity": 3},
        {"name": "Distributed Caching", "description": "Weakness in explaining eviction policies.", "severity": 2},
        {"name": "Trie Data Structures", "description": "Slow implementation speed.", "severity": 1},
    ]}


@router.get("/history")
def get_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).filter(InterviewSession.user_id == current_user.id).order_by(InterviewSession.created_at.desc()).all()
    
    return [
        {
            "id": s.id,
            "role": s.role,
            "company": s.company,
            "persona": s.persona,
            "score": s.score,
            "duration": s.duration,
            "createdAt": s.created_at.isoformat(),
        }
        for s in sessions
    ]
