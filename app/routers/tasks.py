from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends
from celery.result import AsyncResult
from app.dependencies.auth import get_current_active_user

from app.models.document import Document
from app.schemas.user import UserRead
from app.services.document import add_document_to_index
from app.tasks.celery import app
from app.tasks.tasks import upload_document, query_index
from app.tasks.nodes.nodes import IndexingError
from app.schemas.task import TaskStatus
from app.dependencies.database import SessionDep
from fastapi import Query


router = APIRouter()


@router.post('/add_document_to_index', tags=['tasks'])
async def add_task_add_document_to_index(current_user: Annotated[UserRead, Depends(get_current_active_user)], document_id: int, chat_id: int, session: SessionDep) -> str:
    task_id = add_document_to_index(document_id=document_id, chat_id=chat_id, current_user=current_user, session=session)
    if not task_id:
        raise HTTPException(status_code=404, detail="Document not found")
    return task_id

@router.get('/tasks/{task_id}', tags=['tasks'], response_model=TaskStatus)
async def get_task_status(task_id: str, current_user: Annotated[UserRead, Depends(get_current_active_user)]) -> TaskStatus:
    """Report on a background task.

    PENDING means either 'queued, not picked up yet' or 'no such task' — Celery
    stores nothing until a worker starts, so the two are indistinguishable.
    """
    result = AsyncResult(task_id, app=app)
    state = result.state

    if state == 'SUCCESS':
        return TaskStatus(task_id=task_id, state=state, result=result.result)

    if state == 'FAILURE':
        error = result.result
        # IndexingError messages are written for the user. Anything else is an
        # unexpected crash whose text may expose internals, so it is not echoed.
        detail = str(error) if isinstance(error, IndexingError) else 'Indexing failed unexpectedly'
        return TaskStatus(task_id=task_id, state=state, error=detail)

    return TaskStatus(task_id=task_id, state=state)

