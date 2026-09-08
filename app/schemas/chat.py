from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChatBase(BaseModel):
    title: str = Field(max_length=200)

class ChatCreate(ChatBase):
    pass

class ChatUpdate(ChatBase):
    title: str | None = Field(default=None, max_length=200)


class ChatRead(ChatBase):
    id: int
    created_at: datetime
    document_count: int = Field(
        default=0, description="Documents attached to this chat."
    )

    model_config = ConfigDict(from_attributes=True)
