from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Column, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.chat import Chat
    from app.models.document import Document
    from app.models.message import Message

user_chat = Table(
    "user_chat",
    Base.metadata,
    Column("user.id", ForeignKey("user.id", ondelete="CASCADE"), primary_key=True),
    Column("chat.id", ForeignKey("chat.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base):
    __tablename__ = "user"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    password_hash: Mapped[str]
    disabled: Mapped[bool]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    chats: Mapped[list["Chat"]] = relationship(secondary=user_chat, back_populates="users")
    messages: Mapped[list["Message"]] = relationship(back_populates="user")
    documents: Mapped[list["Document"]] = relationship(back_populates='user')