from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Column, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

from app.models.chat import chat_document

if TYPE_CHECKING:
    from app.models.chat import Chat
    from app.models.user import User

class Document(Base):
    __tablename__ = "document"
    id: Mapped[int] = mapped_column(primary_key=True)
    bucket_name: Mapped[str]
    original_file_name: Mapped[str]
    extension: Mapped[str]
    file_name: Mapped[str]
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    chats: Mapped[list["Chat"]] = relationship(secondary=chat_document, back_populates="documents")

    user_id: Mapped[int | None] = mapped_column(ForeignKey("user.id"))
    user: Mapped["User"] = relationship(back_populates="documents")