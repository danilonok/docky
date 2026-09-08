from fastapi import APIRouter, Depends, Request, Response, status


from typing import List, Annotated
from app.dependencies.limiter import limiter
from app.dependencies.auth import get_current_active_user
from app.dependencies.authorization import ChatDep, OwnedDocumentDep
from app.dependencies.database import SessionDep

from app.models.chat import Chat
from app.models.document import Document
from app.schemas.chat import ChatRead
from app.schemas.task import IndexingTask
from app.schemas.document import DocumentRead
from app.schemas.user import UserRead
from app.services import chats as chat_service
router = APIRouter()

@router.get("/chats", tags=["chats"], response_model=list[ChatRead])
async def get_chats(current_user: Annotated[UserRead, Depends(get_current_active_user)], session: SessionDep, offset: int = 0, limit: int = 100) -> List[Chat]:
    """List the current user's chats.

    A user with no chats gets an empty list, not a 404: having nothing yet is a
    normal state for a new account, and the client renders an empty list very
    differently from a failed request.
    """
    return chat_service.get_chats(current_user=current_user, limit=limit, offset=offset, session=session)

@router.get("/chats/{chatId}", tags=["chats"], response_model=ChatRead)
async def get_chat(chat: ChatDep) -> Chat:
    return chat


@router.post("/chats", tags=["chats"], response_model=ChatRead)
async def add_chat(current_user: Annotated[UserRead, Depends(get_current_active_user)], users: List[int], title: str, session: SessionDep) -> Chat:
    chat = chat_service.add_chat(current_user=current_user, session=session, title=title, user_ids=users)
    return chat

@router.post("/chats/{chatId}/documents", tags=["chats"], response_model=IndexingTask)
@limiter.limit("10/minute")
async def add_document_to_chat(request: Request, chat: ChatDep, document: OwnedDocumentDep, session: SessionDep) -> IndexingTask:
    task_id = chat_service.add_document_to_chat(session=session, chat=chat, document=document)
    return IndexingTask(chat_id=chat.id, document_id=document.id, task_id=task_id)


@router.get("/chats/{chatId}/documents", tags=["chats"], response_model=list[DocumentRead])
async def get_documents_in_chat(chat: ChatDep) -> list[Document]:
    """Documents attached to this chat — empty until the user attaches one."""
    return chat_service.get_documents(chat=chat)

@router.delete("/chats/{chatId}/documents", tags=["chats"])
async def delete_documents_in_chat(chat: ChatDep, session: SessionDep) -> Response:
    chat_service.clear_documents_in_chat(session=session, chat=chat)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.delete("/chats/{chatId}", tags=["chats"])
async def delete_chat(chat: ChatDep, session: SessionDep) -> Response:
    chat_service.delete_chat_by_id(chat_id=chat.id, session=session)

    return Response(status_code=status.HTTP_204_NO_CONTENT)