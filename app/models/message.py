from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB

from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from datetime import datetime

if TYPE_CHECKING:
    from app.models.chat import Chat
    from app.models.user import User


class Message(Base):
    __tablename__ = "message"
    id: Mapped[int] = mapped_column(primary_key=True)
    content: Mapped[str | None] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    reply_to: Mapped[int | None]
    agentic: Mapped[bool] = mapped_column(default=False)
    finished: Mapped[bool] = mapped_column(default=True)

    source_nodes: Mapped[list[dict] | None] = mapped_column(JSONB, default=None)
    
    chat_id: Mapped[int | None] = mapped_column(ForeignKey("chat.id"))
    chat: Mapped["Chat"] = relationship(back_populates="messages")

    user_id: Mapped[int | None] = mapped_column(ForeignKey("user.id"))
    user: Mapped["User"] = relationship(back_populates="messages")