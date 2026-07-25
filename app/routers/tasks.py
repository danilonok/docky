from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends
from celery.result import AsyncResult
from app.dependencies.auth import get_current_active_user

from app.models.document import Document
from app.schemas.user import UserRead
from app.tasks.celery import app
from app.tasks.tasks import generate, upload_document, query_index
from app.dependencies.database import SessionDep
from fastapi import Query

# TODO: Move business logic
from sqlalchemy import select

router = APIRouter()


@router.post("/generate", tags=["tasks"])
async def add_task(prompt: str):
    res = generate.delay(prompt)
    return res.id

@router.get("/generate", tags=["tasks"])
async def get_task(task_id: str):
    result = AsyncResult(task_id, app=app)
    if result.state == 'SUCCESS':
        return result.get()
    else:
        return f'Current task status {result.state}'
    
@router.post('/add_document_to_index', tags=['tasks'])
async def add_task_add_document_to_index(current_user: Annotated[UserRead, Depends(get_current_active_user)], document_id: int, chat_id: int, session: SessionDep):
    document = session.scalars(select(Document).where(Document.id == document_id and Document.user_id == current_user.id)).first()
    if not document:
        return None 
    res = upload_document.delay(document.file_name, chat_id)
    return res.id

@router.get('/add_document_to_index', tags=['tasks'])
async def get_task_add_document_to_index(task_id: str):
    result = AsyncResult(task_id, app=app)
    if result.state == 'SUCCESS':
        return result.get()
    else:
        return f'Current task status {result.state}'


@router.post('/query', tags=['tasks'])
async def add_task_query(current_user: Annotated[UserRead, Depends(get_current_active_user)], query:str,  session: SessionDep):
    res = query_index.delay(query, current_user.id)
    return res.id

@router.get('/query', tags=['tasks'])
async def get_task_query(task_id: str):
    result = AsyncResult(task_id, app=app)
    if result.state == 'SUCCESS':
        return result.get()
    else:
        return f'Current task status {result.state}'
