from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Column, Table
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

    chats: Mapped[list["Chat"]] = relationship(secondary=chat_document, back_populates="documents")

    user_id: Mapped[int | None] = mapped_column(ForeignKey("user.id"))
    user: Mapped["User"] = relationship(back_populates="documents")