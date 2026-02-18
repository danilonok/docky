'''
Service module for chat operations
'''
from pydoc import Doc
from app.models.chat import Chat, ChatView
from app.models.user import User, UserDTO
from app.models.document import Document
from app.dependencies.database import SessionDep
from typing import Annotated
from fastapi import Query
from sqlmodel import select, any_
from typing import List

from app.tasks.tasks import upload_document, delete_all_documents

from sqlalchemy.orm import selectinload
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

def get_chat_by_id(id: int, session: SessionDep) -> ChatView | None:
    '''Get a particular chat by the id'''
    chat = session.exec(select(Chat).where(Chat.id == id)
                        #.options(selectinload(Chat.documents))
                        ).first()
    
    chatView = ChatView.model_validate(chat)
    chatView.document_ids = [x.id for x in chat.documents]
    chatView.user_ids = [x.id for x in chat.users]
    chatView.messages_ids = [x.id for x in chat.messages]
    
    return chatView

def delete_chat_by_id(session: SessionDep, chat_id: int) -> Chat | None:
    '''Delete a chat by an id'''
    chat = session.exec(select(Chat).where(Chat.id == chat_id)).first()
    if not chat:
        return None
    
    session.delete(chat)
    session.commit()
    return chat


def add_document_to_chat(session: SessionDep, documentId: int, chatId: int) -> Chat:
    # Find chat
    chat = session.exec(select(Chat).where(Chat.id == chatId)).first()
    # Find document
    document = session.exec(select(Document).where(Document.id == documentId)).first()
    
    if document not in chat.documents:
        chat.documents.append(document)
        session.add(chat)
        session.commit()
        session.refresh(chat)

    # Add document to index
    upload_document.delay(chat_id=chat.id, document_path=document.file_name)

    return chat

def delete_documents_in_chat(session: SessionDep, chatId: int) -> Chat:
    # Find chat
    chat = session.exec(select(Chat).where(Chat.id == chatId)).first()
    
    if chat:
        delete_all_documents.delay(chat_id=chat.id)

        chat.documents.clear()
        session.add(chat)
        session.commit()
        session.refresh(chat)

        return chat

def get_documents(session: SessionDep, chatId: int) -> list[Document]:
    chat = session.exec(select(Chat).where(Chat.id == chatId)).first()
    if chat:
        return chat.documents
    return None