from fastapi import Depends, FastAPI
from contextlib import asynccontextmanager
from app.dependencies.database import create_db_and_tables


from .routers import users

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(users.router)
    

@app.get("/")
async def root():
    return {"message": "Hello Bigger Applications!"}