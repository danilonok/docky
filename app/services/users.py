'''
Service module for user operations
'''

from app.dependencies.database import SessionDep
from typing import Annotated
from fastapi import Query
from app.auth.helpers import get_password_hash

from pydantic import EmailStr

from app.models.user import User
from app.schemas.user import UserCreate

from sqlalchemy import select

# CRUD Operations for Users

def add_user(userCreate: UserCreate, session: SessionDep) -> User:
    user = User(email=userCreate.email, password_hash=get_password_hash(password=userCreate.password), disabled=False)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def get_users(session: SessionDep, offset: int = 0, limit: Annotated[int, Query(le=100)] = 100) -> list[User] | None:
    users = session.scalars(select(User).offset(offset).limit(limit)).all()
    return list(users)

def get_user_by_id(id: int, session: SessionDep) -> User | None:
    user = session.scalars(select(User).where(User.id == id)).first()
    return user

def get_user_by_email(email: EmailStr, session: SessionDep) -> User | None:
    user = session.scalars(select(User).where(User.email == email)).first()
    return user

def delete_user_by_id(session: SessionDep, user_id: int) -> User | None:
    user = session.scalars(select(User).where(User.id == user_id)).first()
    if not user:
        return None
    
    session.delete(user)
    session.commit()
    return user
