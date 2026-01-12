from sqlmodel import Field, SQLModel, Relationship
from pydantic import EmailStr
from pydantic import BaseModel, ConfigDict
from app.models.chat import ChatUserLink

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: EmailStr = Field(default=None, max_length=50)
    password_hash: str | None = Field(default=None)
    disabled: bool = False

    chats: list["Chat"] = Relationship(back_populates='users', link_model=ChatUserLink) # type: ignore

class UserDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr = Field(default=None, max_length=50)
    disabled: bool = False

class UserRegistrationDTO(BaseModel):
    email: EmailStr = Field(default=None, max_length=50)
    password: str = Field(default=None)
