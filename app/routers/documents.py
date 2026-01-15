from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from griffe import Extension

from app.dependencies.database import SessionDep
from app.storage.minio_client import upload_to_minio
import uuid
from typing import List, Annotated
from fastapi import Query
from sqlmodel import select
from app.dependencies.auth import get_current_active_user
import os

from app.models.document import Document

from app.models.user import UserDTO

BUCKET_NAME = 'my-bucket'

router = APIRouter()

# TO-DO: Business logic into service

@router.post("/documents/upload", tags=['documents'])
def upload(current_user: Annotated[UserDTO, Depends(get_current_active_user)], session: SessionDep, file: UploadFile = File(...), ):
    try:
        original_name = file.filename
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

@router.get("/documents", tags=['documents'])
def get_documents(current_user: Annotated[UserDTO, Depends(get_current_active_user)], session: SessionDep):
    # Get all docs
    # Add pagination later
    documents = session.exec(select(Document).where(Document.user_id == current_user.id)).all()
    return documents



