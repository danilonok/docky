'''
Service module for user operations
'''

from app.models.user import User
from app.dependencies.database import SessionDep
from typing import Annotated
from fastapi import Query
from sqlmodel import select
# CRUD Operations for Users

def add_user(user: User, session: SessionDep):
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def get_users(session: SessionDep, offset: int = 0, limit: Annotated[int, Query(le=100)] = 100) -> list[User]:
    users = session.exec(select(User).offset(offset).limit(limit)).all()
    return users

def get_user(id: int, session: SessionDep) -> User:
    users = session.exec(select(User).where(User.id == id)).first()
    return users

