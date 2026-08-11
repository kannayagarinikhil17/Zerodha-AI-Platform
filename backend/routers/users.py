from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

@router.get("/")
async def get_all_users(db: Session = Depends(get_db)):
    try:
        # Use SQLAlchemy to query all user IDs safely
        users = db.query(models.User.user_id).all()
        return {"users": [user.user_id for user in users]}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database connection error")