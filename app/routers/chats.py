from fastapi import APIRouter, HTTPException, Depends

from app.models.chat import Chat
from app.models.user import User

from typing import List, Annotated
from app.dependencies.auth import get_current_active_user
from app.dependencies.database import SessionDep

from app.services import chats as chat_service
router = APIRouter()


@router.get("/chats/", tags=["chats"])
async def get_chats(current_user: Annotated[User, Depends(get_current_active_user)], session: SessionDep, offset: int = 0, limit: int = 100) -> List[Chat]:
    chats = chat_service.get_chats(current_user=current_user, limit=limit, offset=offset, session=session)
    return chats


@router.post("/chats", tags=["chats"])
async def add_chat(current_user: Annotated[User, Depends(get_current_active_user)], users: List[int], title: str, session: SessionDep, ):
    chat = chat_service.add_chat(current_user=current_user, session=session, title=title, user_ids=users)
    return chat