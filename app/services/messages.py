'''
Service module for message operations
'''

from requests import session

from app.dependencies.database import SessionDep, get_session
from typing import Annotated
from fastapi import Query
from typing import List

from sqlalchemy import select

from app.models.chat import Chat
from app.models.message import Message
from app.models.user import User
from app.schemas.user import UserRead


def add_message(content: str, chat_id: int, current_user: UserRead, session: SessionDep) -> Message | None:
    '''Create a new message in the selected chat'''
    '''Creates a user message and sends request to the worker to write a response'''
    chat = session.scalars(select(Chat).where(Chat.id == chat_id)).first()
    user = session.scalars(select(User).where(User.id == current_user.id)).first()
    if user and chat:
        message = Message(content=content, chat=chat, user=user, agentic=False)
        session.add(message)
        session.commit()
        session.refresh(message)
        return message
    return None

def add_agentic_message(chat_id: int, session: SessionDep, reply_to: int | None = None) -> int | None:
    '''
    Creates a new empty agentic messages which can be filled later by the worker.
    Returns id of the new message
    '''   
    chat = session.scalars(select(Chat).where(Chat.id == chat_id)).first()

    if chat:
        message = Message(content=None, agentic=True, finished=False, chat=chat, reply_to=reply_to)
        session.add(message)
        session.commit()
        session.refresh(message)
        return message.id
    return None

def finish_message(content: str, message_id: int, source_nodes: list[dict]):
    session = next(get_session())
    message = session.scalars(select(Message).where(Message.id == message_id)).first()
    print(message)
    if message:
        print(message)
        message.finished = True
        message.content = content
        message.source_nodes = source_nodes
        session.add(message)
        session.commit()
        session.refresh(message)
        return message.content
    return None

def get_messages(session: SessionDep, chat_id: int, offset: int = 0, limit: Annotated[int, Query(le=100)] = 100) -> list[Message] | None:
    '''Get all messages from the chat'''
    chat = session.scalars(select(Chat).where(Chat.id == chat_id)).first()
    if chat:
        messages = session.scalars(select(Message).where(Message.chat_id == chat.id).offset(offset).limit(limit).order_by(Message.created_at)).all()
        return list(messages)
    return None

def get_message_by_id(id: int, session: SessionDep) -> Message | None:
    '''Get a particular message by the id'''
    message = session.scalars(select(Message).where(Message.id == id)).first()
    return message

def delete_message_by_id(session: SessionDep, message_id: int):
    '''Delete a message by an id'''
    message = session.scalars(select(Message).where(Message.id == message_id)).first()
    if not message:
        return None
    
    session.delete(message)
    session.commit()
    return message
