from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

from pydantic import BaseModel
from typing import List

class ChatUserLink(SQLModel, table=True):
    chat_id: int | None = Field(default=0, foreign_key="chat.id", primary_key=True, ondelete="CASCADE")
    user_id: int | None = Field(default=0, foreign_key="user.id", primary_key=True, ondelete="CASCADE")

class Chat(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(max_length=256)
    
    messages: list['Message'] = Relationship(back_populates='chat', cascade_delete=True) # type: ignore
    users: list['User'] = Relationship(back_populates='chats', link_model=ChatUserLink) # type: ignore
    created_at: datetime = Field(default_factory= lambda: datetime.now())




