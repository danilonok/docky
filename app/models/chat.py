from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Column, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.user import user_chat

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.message import Message
    from app.models.user import User

chat_document = Table(
    "chat_document",
    Base.metadata,
    Column("chat.id", ForeignKey("chat.id", ondelete="CASCADE"), primary_key=True),
    Column("document.id", ForeignKey("document.id", ondelete="CASCADE"), primary_key=True),
)

class Chat(Base):
    __tablename__ = "chat"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    users: Mapped[list["User"]] = relationship(secondary=user_chat, back_populates="chats")

    messages: Mapped[list["Message"]] = relationship(back_populates="chat")

    documents: Mapped[list["Document"]] = relationship(secondary=chat_document, back_populates="chats")