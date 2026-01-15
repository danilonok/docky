from sqlmodel import Field, SQLModel, Relationship

from app.models.user import User

class Document(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    bucket_name : str
    original_file_name: str
    extension: str
    file_name: str
    user_id: int | None = Field(default=None, foreign_key="user.id", ondelete="CASCADE")
    user: User | None = Relationship(back_populates="documents")


