from fastapi import APIRouter, HTTPException, Depends, Response, status



from typing import List, Annotated
from app.dependencies.auth import get_current_active_user
from app.dependencies.database import SessionDep

from app.models.message import Message
from app.schemas.message import MessageRead
from app.schemas.user import UserRead
from app.services import messages as message_service
from app.services import chats as chats_service
from app.tasks.tasks import query_index

router = APIRouter()


@router.get("/messages", tags=["messages"], response_model=list[MessageRead])
async def get_messages(current_user: Annotated[UserRead, Depends(get_current_active_user)], chat_id: int, session: SessionDep, offset: int = 0, limit: int = 100) -> List[Message] | None:
    # If user has this current chat
    chat = chats_service.get_chat_by_id(id=chat_id, session=session)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if not any(u.id == current_user.id for u in chat.users): 
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = message_service.get_messages(chat_id=chat_id, limit=limit, offset=offset, session=session)
    return messages


@router.post("/messages", tags=["messages"], response_model=MessageRead)
async def add_message(current_user: Annotated[UserRead, Depends(get_current_active_user)], chat_id: int, content: str, session: SessionDep) -> Message | None:
    # If user has this current chat
    chat = chats_service.get_chat_by_id(id=chat_id, session=session)
    if not chat: raise HTTPException(status_code=404, detail="Chat not found")
    if not any(u.id == current_user.id for u in chat.users): 
        raise HTTPException(status_code=404, detail="Chat not found")
    
    message = message_service.add_message(chat_id=chat_id, content=content, session=session, current_user=current_user)
    if message:
        # Create a job
        agentic_message = message_service.add_agentic_message(chat_id=chat_id, reply_to=message.id, session=session)
        # Fetch all messages
        all_messages = message_service.get_messages(chat_id=chat_id, session=session)
        if not all_messages:
            raise HTTPException(status_code=404, detail="Chat not found")
        dict_messages = [{'type': 'agentic' if message.agentic else 'user', 'content': message.content} for message in all_messages]
        
        query_index.delay(message.content, chat.id, agentic_message, dict_messages)
    return message


@router.delete("/messages", tags=["messages"])
async def delete_message(current_user: Annotated[UserRead, Depends(get_current_active_user)], message_id: int, session: SessionDep) -> Response:
    # If user has this current message
    message = message_service.get_message_by_id(id=message_id, session=session)
    if not message: raise HTTPException(status_code=404, detail="Message not found")
    if not message.user_id == current_user.id:
        raise HTTPException(status_code=403, detail="No permission to do that")


    message_service.delete_message_by_id(message_id=message_id, session=session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)