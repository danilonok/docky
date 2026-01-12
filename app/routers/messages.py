from fastapi import APIRouter, HTTPException, Depends

from app.models.message import Message
from app.models.user import User, UserDTO

from typing import List, Annotated
from app.dependencies.auth import get_current_active_user
from app.dependencies.database import SessionDep

from app.services import messages as message_service
from app.services import chats as chats_service
router = APIRouter()


@router.get("/messages", tags=["messages"])
async def get_messages(current_user: Annotated[User, Depends(get_current_active_user)], chat_id: int, session: SessionDep, offset: int = 0, limit: int = 100) -> List[Message] | None:
    # If user has this current chat
    chat = chats_service.get_chat_by_id(id=chat_id, session=session)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if not any(user.id == current_user.id for user in chat.users): 
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = message_service.get_messages(chat_id=chat_id, limit=limit, offset=offset, session=session)
    return messages


@router.post("/messages", tags=["messages"])
async def add_message(current_user: Annotated[UserDTO, Depends(get_current_active_user)], chat_id: int, content: str, session: SessionDep):
    # If user has this current chat
    chat = chats_service.get_chat_by_id(id=chat_id, session=session)
    if not chat: raise HTTPException(status_code=404, detail="Chat not found")
    if not any(user.id == current_user.id for user in chat.users): 
        raise HTTPException(status_code=404, detail="Chat not found")
    
    message = message_service.add_message(chat_id=chat_id, content=content, session=session, current_user=current_user)
    return message


@router.delete("/messages", tags=["messages"])
async def delete_message(current_user: Annotated[User, Depends(get_current_active_user)], message_id: int, session: SessionDep) -> Message | None:
    # If user has this current message
    message = message_service.get_message_by_id(id=message_id, session=session)
    if not message: raise HTTPException(status_code=404, detail="Message not found")
    if not message.user_id == current_user.id:
        raise HTTPException(status_code=403, detail="No permission to do that")
    

    message = message_service.delete_message_by_id(message_id=message_id, session=session)
    return message