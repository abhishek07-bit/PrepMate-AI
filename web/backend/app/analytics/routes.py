from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User
from app.auth.routes import get_current_user

router = APIRouter()


@router.get("/readiness")
def get_readiness(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"readinessScore": 68, "trend": 4, "criticalGaps": 3, "avgResolutionTime": "42m"}


@router.get("/weaknesses")
def get_weaknesses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"topics": [
        {"name": "Dynamic Programming (2D)", "description": "Consistent failure in identifying overlapping subproblems.", "severity": 3},
        {"name": "Distributed Caching", "description": "Weakness in explaining eviction policies.", "severity": 2},
        {"name": "Trie Data Structures", "description": "Slow implementation speed.", "severity": 1},
    ]}


@router.get("/history")
def get_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"sessions": [
        {"id": "1", "type": "algorithm", "title": "Algorithms Mock", "date": "Yesterday", "duration": "45 mins", "score": 88},
        {"id": "2", "type": "system-design", "title": "System Design Practice", "date": "Oct 24", "duration": "60 mins", "score": 74},
    ]}
