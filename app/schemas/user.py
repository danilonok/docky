# Pass-hash should be shown in read

from pydantic import BaseModel, ConfigDict, Field

from pydantic import EmailStr


class UserBase(BaseModel):
    email: EmailStr = Field(max_length=50)
    disabled: bool = False


class UserCreate(UserBase):
    password: str
    pass

class UserUpdate(UserBase):
    email: EmailStr | None = None
    password_hash: str | None = None
    disabled: bool | None = None

class UserRead(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)