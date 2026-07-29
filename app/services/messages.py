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

# How many recent messages to replay as LLM chat history. Kept well under the
# model's context window so retrieved document chunks still fit alongside it.
HISTORY_LIMIT = 20


def add_message(content: str, chat: Chat, current_user: UserRead, session: SessionDep) -> Message | None:
    '''Create a new message in the selected chat'''
    '''Creates a user message and sends request to the worker to write a response'''
    
    message = Message(content=content, chat=chat, user=current_user, agentic=False)
    session.add(message)
    session.commit()
    session.refresh(message)
    return message


def add_agentic_message(chat: Chat, session: SessionDep, reply_to: int | None = None) -> int | None:
    '''
    Creates a new empty agentic messages which can be filled later by the worker.
    Returns id of the new message
    '''   

    message = Message(content=None, agentic=True, finished=False, chat=chat, reply_to=reply_to)
    session.add(message)
    session.commit()
    session.refresh(message)
    return message.id


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

def get_messages(session: SessionDep, chat: Chat, offset: int = 0, limit: Annotated[int, Query(le=100)] = 100) -> list[Message]:
    '''Get all messages from the chat'''
    messages = session.scalars(select(Message).where(Message.chat_id == chat.id).offset(offset).limit(limit).order_by(Message.created_at)).all()
    return list(messages)


def get_history(session: SessionDep, chat: Chat, limit: int = HISTORY_LIMIT) -> list[Message]:
    '''
    Get the most recent messages of the chat, returned oldest-first.

    Unlike get_messages, which pages forward from the start of the chat, this
    takes the newest `limit` messages so that long chats keep their recent
    context instead of replaying their opening turns.
    '''
    recent = session.scalars(
        select(Message)
        .where(Message.chat_id == chat.id)
        .order_by(Message.created_at.desc(), Message.id.desc())
        .limit(limit)
    ).all()
    # Reverse back into chronological order for the LLM.
    return list(reversed(recent))


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
