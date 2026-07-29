from fastapi import Depends, FastAPI,  HTTPException, status
from contextlib import asynccontextmanager

from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from app.dependencies.database import SessionDep

from .routers import users, chats, messages, tasks, documents
from typing import Annotated

from app.auth.helpers import ACCESS_TOKEN_EXPIRE_MINUTES, Token

from app.dependencies.auth import authenticate_user, create_access_token

from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost",
    "http://localhost:8980",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)





app.include_router(users.router)
app.include_router(chats.router)
app.include_router(messages.router)
app.include_router(tasks.router)
app.include_router(documents.router)

@app.get("/")
async def root():
    return {"message": "Hello Bigger Applications!"}

@app.post("/token", tags=["auth"])
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: SessionDep
) -> Token:
    user = authenticate_user(form_data.username, form_data.password, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")
