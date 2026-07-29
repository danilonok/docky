from fastapi import APIRouter, HTTPException, Depends, Response, status



from typing import List, Annotated
from app.dependencies.auth import get_current_active_user
from app.dependencies.authorization import ChatDep, OwnedMessageDep
from app.dependencies.database import SessionDep

from app.models.message import Message
from app.schemas.message import MessageRead
from app.schemas.user import UserRead
from app.services import messages as message_service
from app.services import chats as chats_service
from app.tasks.tasks import query_index

router = APIRouter()


@router.get("/messages", tags=["messages"], response_model=list[MessageRead])
async def get_messages(chat: ChatDep, session: SessionDep, offset: int = 0, limit: int = 100) -> List[Message] | None:
    messages = message_service.get_messages(chat=chat, limit=limit, offset=offset, session=session)
    return messages


@router.post("/messages", tags=["messages"], response_model=MessageRead)
async def add_message(chat: ChatDep, current_user: Annotated[UserRead, Depends(get_current_active_user)], content: str, session: SessionDep) -> Message | None:    
    message = message_service.add_message(chat=chat, content=content, session=session, current_user=current_user)
    if message:
        # Create a job
        agentic_message = message_service.add_agentic_message(chat=chat, reply_to=message.id, session=session)
        # Fetch the most recent messages as chat history
        history = message_service.get_history(chat=chat, session=session)
        dict_messages = [{'type': 'agentic' if m.agentic else 'user', 'content': m.content} for m in history]
        
        query_index.delay(message.content, chat.id, agentic_message, dict_messages)
    return message


@router.delete("/messages", tags=["messages"])
async def delete_message(current_user: Annotated[UserRead, Depends(get_current_active_user)], message: OwnedMessageDep, session: SessionDep) -> Response:
    message_service.delete_message_by_id(message_id=message.id, session=session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)