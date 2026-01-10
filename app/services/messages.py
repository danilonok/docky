'''
Service module for message operations
'''
from app.models.chat import Chat
from app.models.message import Message
from app.models.user import User
from app.dependencies.database import SessionDep
from typing import Annotated
from fastapi import Query
from sqlmodel import select
from typing import List


def add_message(content: str, chat_id: int, session: SessionDep) -> Message:
    '''Create a new message in the selected chat'''
    chat = session.exec(select(Chat).where(Chat.id == chat_id)).first()

    message = Message(content=content, chat=chat)
    session.add(message)
    session.commit()
    session.refresh(message)
    return message

def get_messages(session: SessionDep, chat_id: int, offset: int = 0, limit: Annotated[int, Query(le=100)] = 100) -> list[Message] | None:
    '''Get all chats of the current user'''
    chat = session.exec(select(Chat).where(Chat.id == chat_id)).first()
    if chat:
        messages = session.exec(select(Message).where(Message.chat_id == chat.id).offset(offset).limit(limit)).all()
        return list(messages)
    return None

def get_message_by_id(id: int, session: SessionDep) -> Message | None:
    '''Get a particular message by the id'''
    message = session.exec(select(Message).where(Message.id == id)).first()
    return message

