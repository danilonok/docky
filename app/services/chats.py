'''
Service module for chat operations
'''
from app.models.chat import Chat
from app.models.user import User, UserDTO
from app.dependencies.database import SessionDep
from typing import Annotated
from fastapi import Query
from sqlmodel import select, any_
from typing import List
# CRUD Operations for Users

def add_chat(user_ids: List[int], current_user: UserDTO, title: str, session: SessionDep) -> Chat:
    '''Create a new chat with user_ids and a current user'''
    users = []
    user_ids.append(current_user.id)
    for u_id in user_ids:
        user = session.exec(select(User).where(User.id == u_id)).first()
        if user: users.append(user)

    chat = Chat(title=title, users=users)
    session.add(chat)
    session.commit()
    session.refresh(chat)
    return chat

def get_chats(session: SessionDep, current_user: UserDTO, offset: int = 0, limit: Annotated[int, Query(le=100)] = 100) -> list[Chat] | None:
    '''Get all chats of the current user'''
    chats = session.exec(select(Chat).where(Chat.users.any(User.id==current_user.id)).offset(offset).limit(limit)).all() # type: ignore
    return list(chats)

def get_chat_by_id(id: int, session: SessionDep) -> Chat | None:
    '''Get a particular chat by the id'''
    chat = session.exec(select(Chat).where(Chat.id == id)).first()
    return chat

def delete_chat_by_id(session: SessionDep, chat_id: int) -> Chat | None:
    '''Delete a chat by an id'''
    chat = session.exec(select(Chat).where(Chat.id == chat_id)).first()
    if not chat:
        return None
    
    session.delete(chat)
    session.commit()
    return chat

