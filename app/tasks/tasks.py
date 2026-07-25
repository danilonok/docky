from app.tasks.celery import app
from app.tasks.nodes.nodes import add_document_to_index, query_rag, clear_documents_in_chat, add_summary

@app.task
def upload_document(document_path: str, chat_id: int):
    result = add_document_to_index(document_path=document_path, chat_id=chat_id)
    return result

@app.task
def query_index(query: str, chat_id: int, message_id: int, messages: list[dict]):
    result = query_rag(query=query, chat_id=chat_id, message_id=message_id, messages=messages)
    return result

@app.task
def delete_all_documents(chat_id: int):
    result = clear_documents_in_chat(chat_id=chat_id)
    return result

@app.task
def add_summary_task(nodes: list[dict], chat_id: int):
    result = add_summary(nodes, chat_id=chat_id)
    return result