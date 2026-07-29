'''
Service module for chat operations
'''

from app.dependencies.database import SessionDep
from typing import Annotated
from fastapi import Query

from typing import List

from app.models.chat import Chat
from app.models.document import Document
from app.models.user import User
from app.schemas.user import UserRead
from app.tasks.tasks import upload_document, delete_all_documents

from sqlalchemy.orm import selectinload
from sqlalchemy import select

# CRUD Operations for Users

def add_chat(user_ids: List[int], current_user: UserRead, title: str, session: SessionDep) -> Chat:
    '''Create a new chat with user_ids and a current user'''
    users = []
    user_ids.append(current_user.id)
    for u_id in user_ids:
        user = session.scalars(select(User).where(User.id == u_id)).first()
        if user: users.append(user)

    chat = Chat(title=title, users=users)
    session.add(chat)
    session.commit()
    session.refresh(chat)
    return chat

def get_chats(session: SessionDep, current_user: UserRead, offset: int = 0, limit: Annotated[int, Query(le=100)] = 100) -> list[Chat] | None:
    '''Get all chats of the current user'''
    chats = session.scalars(select(Chat).where(Chat.users.any(User.id==current_user.id)).offset(offset).limit(limit)).all() 
    return list(chats)

def get_chat_by_id(id: int, session: SessionDep) -> Chat | None:
    '''Get a particular chat by the id'''
    chat = session.scalars(select(Chat).where(Chat.id == id)
                        ).first()
    
    return chat

def delete_chat_by_id(session: SessionDep, chat_id: int) -> Chat | None:
    '''Delete a chat by an id'''
    chat = session.scalars(select(Chat).where(Chat.id == chat_id)).first()
    if not chat:
        return None
    
    session.delete(chat)
    session.commit()
    return chat


def add_document_to_chat(session: SessionDep, document: Document, chat: Chat) -> Chat:
    '''Attach an already-authorized document to an already-authorized chat'''
    if document not in chat.documents:
        chat.documents.append(document)
        session.commit()
        # Add document to index
        upload_document.delay(chat_id=chat.id, document_path=document.file_name)

    return chat

def clear_documents_in_chat(session: SessionDep, chat: Chat) -> None:
    chat.documents.clear()
    session.commit()
    delete_all_documents.delay(chat_id=chat.id)
    return None

def get_documents(chat: Chat) -> list[Document]:
    '''Get all documents attached to an already-authorized chat'''
    return chat.documents