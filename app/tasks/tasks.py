from app.dependencies.database import SessionDep
from app.models.document import Document
from app.tasks.celery import app

from app.tasks.nodes.nodes import add_document_to_index, query_rag

from llama_index.core import Settings




@app.task
def generate(prompt: str):
    result = Settings.llm.complete(prompt)
    return result.text

@app.task
def upload_document(document_path: str, user_id: int):
    result = add_document_to_index(document_path=document_path, user_id=user_id)
    return result

@app.task
def query_index(query: str, chat_id: int, message_id: int):
    result = query_rag(query=query, chat_id=chat_id, message_id=message_id)
    return result

