from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from griffe import Extension

from app.dependencies.database import SessionDep
from app.models.document import Document
from app.schemas.document import DocumentRead
from app.schemas.user import UserRead
from app.storage.minio_client import upload_to_minio
import uuid
from typing import List, Annotated
from fastapi import Query
from app.dependencies.auth import get_current_active_user
import os

# TODO: Delete after moving the business logic
from sqlalchemy import select

BUCKET_NAME = 'my-bucket'

router = APIRouter()

# TODO: Business logic into service

@router.post("/documents/upload", tags=['documents'])
def upload(current_user: Annotated[UserRead, Depends(get_current_active_user)], session: SessionDep, file: UploadFile = File(...), ):
    try:
        original_name = file.filename
        # TODO: Fix splittext pylance error
        extension = os.path.splitext(file.filename)[1]
        file_id = str(uuid.uuid4())

        filename = f'user-{current_user.id}/documents/{file_id}{extension}'
        result = upload_to_minio(file.file, filename, BUCKET_NAME)
        if result:
            document = Document(bucket_name=BUCKET_NAME, file_name=filename, extension=extension, original_file_name=original_name, user_id=current_user.id)
            session.add(document)
            session.commit()
    except Exception:
        raise HTTPException(status_code=500, detail='Something went wrong')
    finally:
        file.file.close()

    return {"message": f"Successfully uploaded {file.filename}"}

@router.get("/documents", tags=['documents'], response_model=list[DocumentRead])
def get_documents(current_user: Annotated[UserRead, Depends(get_current_active_user)], session: SessionDep) -> list[Document] | None:
    # Get all docs
    # TODO: Add pagination later
    documents = session.scalars(select(Document).where(Document.user_id == current_user.id)).all()
    return documents



