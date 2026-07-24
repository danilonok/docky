from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field




class MessageBase(BaseModel):
    content : str
    created_at: datetime
    reply_to: int | None = None
    agentic: bool
    finished: bool
    source_nodes: list[dict] | None = None

class MessageCreate(MessageBase):
    pass

class MessageUpdate(MessageBase):
    content : str | None = None
    created_at: datetime | None = None
    reply_to: int | None = None
    agentic: bool | None = None
    finished: bool | None = None
    source_nodes: list[dict] | None = None


class MessageRead(MessageBase):
    id: int

    user_id: int | None = None
    chat_id: int | None = None

    model_config = ConfigDict(from_attributes=True)