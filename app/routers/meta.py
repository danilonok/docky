from typing import Annotated

from fastapi import APIRouter, Depends

from app.config import get_settings
from app.dependencies.auth import get_current_active_user
from app.schemas.meta import ServerInfo
from app.schemas.user import UserRead

router = APIRouter()


@router.get("/meta", tags=["meta"], response_model=ServerInfo)
async def get_server_info(
    current_user: Annotated[UserRead, Depends(get_current_active_user)],
) -> ServerInfo:
    """Describe the running deployment.

    Behind auth: none of it is sensitive, but there is no reason to hand an
    anonymous caller an inventory of what this instance runs.
    """
    settings = get_settings()
    return ServerInfo(
        llm_model=settings.llm_model,
        embedding_model=settings.embedding_model,
        document_parser=str(settings.document_parser),
    )
