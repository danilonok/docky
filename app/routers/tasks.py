from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends
from celery.result import AsyncResult
from app.dependencies.auth import get_current_active_user

from app.models.document import Document
from app.schemas.user import UserRead
from app.services.document import add_document_to_index
from app.tasks.celery import app
from app.tasks.tasks import upload_document, query_index
from app.dependencies.database import SessionDep
from fastapi import Query


router = APIRouter()


@router.post('/add_document_to_index', tags=['tasks'])
async def add_task_add_document_to_index(current_user: Annotated[UserRead, Depends(get_current_active_user)], document_id: int, chat_id: int, session: SessionDep) -> str:
    task_id = add_document_to_index(document_id=document_id, chat_id=chat_id, current_user=current_user, session=session)
    if not task_id:
        raise HTTPException(status_code=404, detail="Document not found")
    return task_id

@router.get('/add_document_to_index', tags=['tasks'])
async def get_task_add_document_to_index(task_id: str, current_user: Annotated[UserRead, Depends(get_current_active_user)]):
    result = AsyncResult(task_id, app=app)
    if result.state == 'SUCCESS':
        return result.get()
    else:
        return f'Current task status {result.state}'

