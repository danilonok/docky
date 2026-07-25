from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from typing import Annotated
from fastapi import Depends
from sqlalchemy.orm import DeclarativeBase

import os

from app.models import Base

db_url = f"postgresql+psycopg2://{os.environ['POSTGRES_USER']}:{os.environ['POSTGRES_PASSWORD']}@{os.environ['POSTGRES_HOST']}:5432/db"

engine = create_engine(db_url)


def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]