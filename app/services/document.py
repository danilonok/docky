'''
Service module for docs operations
'''

import os
import uuid

from fastapi import UploadFile

from app.models import document
from app.models.document import Document
from app.dependencies.database import SessionDep
from app.storage.minio_client import upload_to_minio
from sqlalchemy import select

from app.schemas.user import UserRead
from app.tasks.tasks import upload_document

BUCKET_NAME = 'my-bucket'


def add_document(file: UploadFile, current_user: UserRead, session: SessionDep) -> Document | None:
    '''Upload a file to the object storage and save its metadata'''
    original_file_name = file.filename or ''
    extension = os.path.splitext(original_file_name)[1]
    file_id = str(uuid.uuid4())
    file_name = f'user-{current_user.id}/documents/{file_id}{extension}'

    try:
        uploaded = upload_to_minio(file.file, file_name, BUCKET_NAME)
    finally:
        file.file.close()

    if not uploaded:
        return None

    document = Document(bucket_name=BUCKET_NAME, file_name=file_name, extension=extension, original_file_name=original_file_name, user_id=current_user.id)
    session.add(document)
    session.commit()
    session.refresh(document)
    return document

def get_document(documentId: int, session: SessionDep) -> Document | None:
    """Get a single document by its id"""
    document = session.scalars(select(Document).where(Document.id == documentId)).first()
    return document

def get_documents(current_user: UserRead, session: SessionDep, offset: int = 0, limit: int = 100) -> list[Document]:
    '''Get all documents of the current user'''
    documents = session.scalars(select(Document).where(Document.user_id == current_user.id).offset(offset).limit(limit)).all()
    return list(documents)

def add_document_to_index(document_id: int, chat_id: int, current_user: UserRead, session: SessionDep) -> str | None:
    document = session.scalars(select(Document).where((Document.id == document_id) & (Document.user_id == current_user.id))).first()
    if not document:
        return None
    res = upload_document.delay(document.file_name, chat_id)
    return res.id
