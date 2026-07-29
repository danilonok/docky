# Pass-hash should be shown in read

from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, field_validator, validator

from pydantic import EmailStr


class UserBase(BaseModel):
    email: EmailStr = Field(max_length=50)
    disabled: bool = False


SPECIAL_CHARACTERS = "!@#$%^&*()-_=+[]{};:,.<>?/\\|`~'\""


def check_password(value: str) -> str:
    if not any(c.isupper() for c in value):
        raise ValueError("Password must contain uppercase letter")
    if not any(c.isdigit() for c in value):
        raise ValueError("Password must contain digit")
    if not any(c in SPECIAL_CHARACTERS for c in value):
        raise ValueError("Password must contain special character")
    return value

class UserCreate(UserBase):
    password: Annotated[str, Field(min_length=8), AfterValidator(check_password)]
    pass

class UserUpdate(UserBase):
    email: EmailStr | None = None
    password_hash: str | None = None
    disabled: bool | None = None

class UserRead(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)