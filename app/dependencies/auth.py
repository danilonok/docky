import jwt
from jwt.exceptions import InvalidTokenError
from datetime import datetime, timedelta, timezone
from app.dependencies.database import SessionDep
from typing import Annotated
from fastapi import Depends, HTTPException, status

from app.models.user import User, UserDTO

from app.auth.helpers import verify_password, SECRET_KEY, ALGORITHM, oauth2_scheme, TokenData

from app.services.users import get_user_by_email




def authenticate_user(username: str, password: str, session: SessionDep) -> User | None:
    user = get_user_by_email(username, session)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], session: SessionDep) -> UserDTO: 
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    
    user = get_user_by_email(email=token_data.username, session=session)
    if user is None:
        raise credentials_exception
    return UserDTO.model_validate(user)

async def get_current_active_user(current_user: Annotated[UserDTO, Depends(get_current_user)]) -> UserDTO:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user