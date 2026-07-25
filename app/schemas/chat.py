from pydantic import BaseModel, ConfigDict, Field


class ChatBase(BaseModel):
    title: str = Field(max_length=200)

class ChatCreate(ChatBase):
    pass

class ChatUpdate(ChatBase):
    title: str | None = Field(default=None, max_length=200)


class ChatRead(ChatBase):
    id: int

    model_config = ConfigDict(from_attributes=True)