from sqlmodel import Field, SQLModel, Relationship, Column, JSON

from datetime import datetime
from pydantic import BaseModel
from typing import List
from app.models.chat import Chat
from app.models.user import User

class Message(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    content: str | None

    chat_id: int | None = Field(default=None, foreign_key="chat.id", ondelete="CASCADE")
    chat: Chat | None = Relationship(back_populates="messages")
    created_at: datetime = Field(default_factory= lambda: datetime.now())
    reply_to: int | None
    agentic: bool = False
    finished: bool = True
    # For now - store the top-nodes as a simple JSON
    source_nodes: List[dict] | None = Field(
        default=None, 
        sa_column=Column(JSON)
    )
    user_id: int | None = Field(default=None, foreign_key="user.id", ondelete="CASCADE")
    user: User | None = Relationship(back_populates="messages")




