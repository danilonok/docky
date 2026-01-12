from sqlmodel import Field, SQLModel, Relationship

from datetime import datetime
from pydantic import BaseModel
from typing import List
from app.models.chat import Chat

class Message(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    content: str | None

    chat_id: int | None = Field(default=None, foreign_key="chat.id")
    chat: Chat | None = Relationship(back_populates="messages")
    created_at: datetime = Field(default_factory= lambda: datetime.now())




