from fastapi import APIRouter, HTTPException, Depends

from app.models.chat import Chat
from app.models.user import User, UserDTO

from typing import List, Annotated
from app.dependencies.auth import get_current_active_user
from app.dependencies.database import SessionDep

from app.services import chats as chat_service
router = APIRouter()


@router.get("/chats", tags=["chats"])
async def get_chats(current_user: Annotated[UserDTO, Depends(get_current_active_user)], session: SessionDep, offset: int = 0, limit: int = 100) -> List[Chat] | None:
    chats = chat_service.get_chats(current_user=current_user, limit=limit, offset=offset, session=session)
    return chats


@router.post("/chats", tags=["chats"])
async def add_chat(current_user: Annotated[UserDTO, Depends(get_current_active_user)], users: List[int], title: str, session: SessionDep) -> Chat:
    chat = chat_service.add_chat(current_user=current_user, session=session, title=title, user_ids=users)
    return chat

@router.delete("/chats", tags=["chats"])
async def delete_chat(current_user: Annotated[UserDTO, Depends(get_current_active_user)], chat_id: int, session: SessionDep) -> Chat | None:
    # Check if chat exists and has this user in it
    chat = chat_service.get_chat_by_id(id=chat_id, session=session)
    if not chat: raise HTTPException(status_code=404, detail="Chat not found")
    if not any(user.id == current_user.id for user in chat.users): 
        raise HTTPException(status_code=404, detail="Chat not found")
    
    chat = chat_service.delete_chat_by_id(chat_id=chat_id, session=session)

    return chat