from fastapi import APIRouter, HTTPException, Depends
from app.models.user import User, UserRegistrationDTO
from app.services import users as user_service

from app.dependencies.database import SessionDep

from app.dependencies.auth import get_current_active_user

from typing import Annotated

router = APIRouter()


@router.get("/users/", tags=["users"])
async def get_users(session: SessionDep, offset: int = 0, limit: int = 100):
    users = user_service.get_users(session, offset=offset, limit=limit)
    return users

@router.get("/users/me", tags=["users"])
async def get_current_user(current_user: Annotated[User, Depends(get_current_active_user)], session: SessionDep):
    user = current_user
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.post("/users", tags=["users"])
async def add_user(user: UserRegistrationDTO, session: SessionDep):
    user = user_service.add_user(user, session)
    return user