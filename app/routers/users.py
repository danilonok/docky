from fastapi import APIRouter, HTTPException, Depends
from app.models.user import User, UserRegistrationDTO, UserDTO
from app.services import users as user_service

from app.dependencies.database import SessionDep

from app.dependencies.auth import get_current_active_user

from typing import Annotated

router = APIRouter()

# For later: adding admin role authorization
# @router.get("/users/", tags=["users"])
# async def get_users(session: SessionDep, offset: int = 0, limit: int = 100):
#     users = user_service.get_users(session, offset=offset, limit=limit)
#     return users

@router.get("/users/me", tags=["users"])
async def get_current_user(current_user: Annotated[User, Depends(get_current_active_user)], session: SessionDep) -> UserDTO:
    user = current_user
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserDTO.model_validate(user)


@router.post("/users", tags=["users"])
async def add_user(user: UserRegistrationDTO, session: SessionDep) -> UserDTO:
    # Check if the user with such email exists

    check_user = user_service.get_user_by_email(user.email, session)
    if check_user:
        raise HTTPException(status_code=409, detail="User with such email exists")
    
    created_user = user_service.add_user(user, session)

    return created_user

@router.delete("/users", tags=["users"])
async def delete_user(current_user: Annotated[User, Depends(get_current_active_user)], user_id: int, session: SessionDep) -> UserDTO | None:
    # Check if the user exists

    user = user_service.get_user_by_id(id=user_id, session=session)
    if not user:
        raise HTTPException(status_code=404, detail="User does not exists")
    if not user.id == current_user.id: raise HTTPException(status_code=403, detail="Not enough permissions")
    
    user = user_service.delete_user_by_id(user_id=user_id, session=session)

    return user