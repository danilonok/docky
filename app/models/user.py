from sqlmodel import Field, SQLModel 
from pydantic import EmailStr
from pydantic import BaseModel

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: EmailStr = Field(default=None, max_length=50)
    password_hash: str | None = Field(default=None)
    disabled: bool = False

class UserRegistrationDTO(BaseModel):
    email: EmailStr = Field(default=None, max_length=50)
    password: str = Field(default=None)
