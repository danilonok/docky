from fastapi import APIRouter, HTTPException
from app.models.user import User
from app.services import users as user_service

from app.dependencies.database import SessionDep

router = APIRouter()


@router.get("/users/", tags=["users"])
async def get_users(session: SessionDep):
    users = user_service.get_users(session)
    return users

@router.get("/user/", tags=["users"])
async def get_user(id:int, session: SessionDep):
    user = user_service.get_user(id, session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.post("/users", tags=["users"])
async def add_user(user: User, session: SessionDep):
    user = user_service.add_user(user, session)
    return user