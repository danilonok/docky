from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from typing import Annotated
from fastapi import Depends
from sqlalchemy.orm import DeclarativeBase

import os

from app.models import Base


from contextlib import contextmanager
from collections.abc import Generator

@contextmanager
def session_scope() -> Generator[Session]:
    """A session for code outside a request: Celery tasks, scripts."""
    with Session(engine) as session:
        yield session

db_url = f"postgresql+psycopg2://{os.environ['POSTGRES_USER']}:{os.environ['POSTGRES_PASSWORD']}@{os.environ['POSTGRES_HOST']}:5432/db"

engine = create_engine(db_url)


def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]