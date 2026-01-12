'''
Service module for user operations
'''

from app.models.user import User, UserRegistrationDTO, UserDTO
from app.dependencies.database import SessionDep
from typing import Annotated
from fastapi import Query
from sqlmodel import select
from app.auth.helpers import get_password_hash

from pydantic import EmailStr
# CRUD Operations for Users

def add_user(userDTO: UserRegistrationDTO, session: SessionDep) -> UserDTO:
    user = User(email=userDTO.email, password_hash=get_password_hash(password=userDTO.password), disabled=False)
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserDTO.model_validate(user)

def get_users(session: SessionDep, offset: int = 0, limit: Annotated[int, Query(le=100)] = 100) -> list[UserDTO]:
    users = session.exec(select(User).offset(offset).limit(limit)).all()
    return [UserDTO.model_validate(user) for user in users]

def get_user_by_id(id: int, session: SessionDep) -> User | None:
    user = session.exec(select(User).where(User.id == id)).first()
    return user

def get_user_by_email(email: EmailStr, session: SessionDep) -> User | None:
    user = session.exec(select(User).where(User.email == email)).first()
    return user

def delete_user_by_id(session: SessionDep, user_id: int) -> UserDTO | None:
    '''Delete a user by an id'''
    user = session.exec(select(User).where(User.id == user_id)).first()
    if not user:
        return None
    
    session.delete(user)
    session.commit()
    return UserDTO.model_validate(user)
