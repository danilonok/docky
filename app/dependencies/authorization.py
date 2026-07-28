

from typing import Annotated

from fastapi import Depends, HTTPException

from app.dependencies.auth import get_current_active_user
from app.dependencies.database import SessionDep
from app.models.chat import Chat
from app.models.document import Document
from app.schemas.user import UserRead
from app.services.chats import get_chat_by_id
from app.services.document import get_document

def get_authorized_chat(chatId: int, 
                        current_user: Annotated[UserRead, Depends(get_current_active_user)],
                        session: SessionDep) -> Chat:
    chat = get_chat_by_id(id=chatId, session=session)

    if not chat or not any(u.id == current_user.id for u in chat.users):
        raise HTTPException(status_code=404, detail="Chat not found")

    return chat


def get_owned_document(documentId: int,
                            current_user: Annotated[UserRead, Depends(get_current_active_user)],
                            session: SessionDep) -> Document:
    document = get_document(documentId=documentId, session=session)
    if not document or document.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document

ChatDep = Annotated[Chat, Depends(get_authorized_chat)]
OwnedDocumentDep = Annotated[Document, Depends(get_owned_document)]