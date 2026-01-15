from fastapi import APIRouter, HTTPException, Depends
from celery.result import AsyncResult
from app.tasks.celery import app
from app.tasks.tasks import generate

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
