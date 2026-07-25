from fastapi import APIRouter, Depends, File, UploadFile, HTTPException

from app.dependencies.database import SessionDep
from app.models.document import Document
from app.schemas.document import DocumentRead
from app.schemas.user import UserRead
from app.services import document as document_service
from typing import List, Annotated
from app.dependencies.auth import get_current_active_user

router = APIRouter()


@router.post("/documents/upload", tags=['documents'])
def upload(current_user: Annotated[UserRead, Depends(get_current_active_user)], session: SessionDep, file: UploadFile = File(...), ):
    if not file.filename:
        raise HTTPException(status_code=400, detail="File must have a filename")

    document = document_service.add_document(file=file, current_user=current_user, session=session)
    if not document:
        raise HTTPException(status_code=500, detail='Something went wrong')

    return {"message": f"Successfully uploaded {document.original_file_name}"}

@router.get("/documents", tags=['documents'], response_model=list[DocumentRead])
def get_documents(current_user: Annotated[UserRead, Depends(get_current_active_user)],  session: SessionDep, offset: int = 0, limit: int = 100) -> list[Document] | None:
    return document_service.get_documents(current_user=current_user, limit=limit, offset=offset, session=session)
