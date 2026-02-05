'''
Service module for message operations
'''
from email import message

from requests import session
from app.models.chat import Chat
from app.models.message import Message
from app.models.user import User, UserDTO
from app.dependencies.database import SessionDep, get_session
from typing import Annotated
from fastapi import Query
from sqlmodel import Session, select
from typing import List


def add_message(content: str, chat_id: int, current_user: UserDTO, session: SessionDep) -> Message | None:
    '''Create a new message in the selected chat'''
    '''Creates a user message and sends request to the worker to write a response'''
    chat = session.exec(select(Chat).where(Chat.id == chat_id)).first()
    user = session.exec(select(User).where(User.id == current_user.id)).first()
    if user and chat:
        message = Message(content=content, chat=chat, user=user, agentic=False)
        session.add(message)
        session.commit()
        session.refresh(message)
        return message
    return None

def add_agentic_message(chat_id: int, session: SessionDep, reply_to: int = None) -> int | None:
    '''
    Creates a new empty agentic messages which can be filled later by the worker.
    Returns id of the new message
    '''   
    chat = session.exec(select(Chat).where(Chat.id == chat_id)).first()

    if chat:
        message = Message(content=None, agentic=True, finished=False, chat=chat, reply_to=reply_to)
        session.add(message)
        session.commit()
        session.refresh(message)
        return message.id
    return None

def finish_message(content: str, message_id: int):
    session = next(get_session())
    message = session.exec(select(Message).where(Message.id == message_id)).first()
    if message:
        message.finished = True
        message.content = content
        return message
    return None

def get_messages(session: SessionDep, chat_id: int, offset: int = 0, limit: Annotated[int, Query(le=100)] = 100) -> list[Message] | None:
    '''Get all messages from the chat'''
    chat = session.exec(select(Chat).where(Chat.id == chat_id)).first()
    if chat:
        messages = session.exec(select(Message).where(Message.chat_id == chat.id).offset(offset).limit(limit)).all()
        return list(messages)
    return None

def get_message_by_id(id: int, session: SessionDep) -> Message | None:
    '''Get a particular message by the id'''
    message = session.exec(select(Message).where(Message.id == id)).first()
    return message

def delete_message_by_id(session: SessionDep, message_id: int):
    '''Delete a message by an id'''
    message = session.exec(select(Message).where(Message.id == message_id)).first()
    if not message:
        return None
    
    session.delete(message)
    session.commit()
    return message
