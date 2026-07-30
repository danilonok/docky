from importlib import metadata
from io import BytesIO
from httpx import delete
from llama_index.core import SummaryIndex, VectorStoreIndex
import requests
from app.dependencies.database import SessionDep, session_scope

from llama_index.core import VectorStoreIndex

from llama_index.core import Settings
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding

from llama_index.core.indices.vector_store.base import VectorStoreIndex
from llama_index.vector_stores.qdrant import QdrantVectorStore
import qdrant_client

from llama_index.core.schema import TextNode

from app.services.messages import finish_message


from app.storage.minio_client import download_from_minio


from llama_index.core.vector_stores.types import (
    MetadataFilter,
    MetadataFilters,
)

from llama_index.core.chat_engine import ContextChatEngine
from llama_index.core.llms import ChatMessage, MessageRole

import os

Settings.llm = Ollama(model="gemma3:1b-it-q4_K_M", request_timeout=120.0, base_url=f"http://{os.environ.get('OLLAMA_HOST')}:11434", context_window=4000)
Settings.embed_model = OllamaEmbedding(model_name='embeddinggemma', request_timeout=120.0, base_url=f"http://{os.environ.get('OLLAMA_HOST')}:11434")


BUCKET_NAME = 'my-bucket'


client = qdrant_client.QdrantClient(
    f"http://{os.environ.get('QDRANT_HOST')}:6333",
    api_key=None, # For Qdrant Cloud, None for local instance
)

vector_store = QdrantVectorStore(client=client, collection_name="documents")
index = VectorStoreIndex.from_vector_store(vector_store=vector_store)

EMBED_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"


def get_chunks(filename, filestream: BytesIO):
    url = f"http://{os.environ.get('DOCLING_HOST')}:5001/v1/chunk/hybrid/file"
    filestream.seek(0)

    files = [
        ('files', (filename, filestream, 'application/pdf'))
    ]

    data = {
        "include_converted_doc": "true",
        "convert_do_ocr": "true",
        "target_type": "inbody",
        "chunking_merge_peers": "true"
    }

    try:
        response = requests.post(url, files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            doc = result['documents'][0]
            
            
            if doc['status'] == 'success':
                print(f"Successfully processed! Found {len(result['chunks'])} chunks.")
                return result['chunks']
            else:
                print(f"Server rejected the file. Errors: {doc.get('errors')}")
        else:
            print(f"HTTP {response.status_code}: {response.text}")

    except Exception as e:
        print(f"Connection Error: {e}")


def add_summary(nodes: list[dict], chat_id: int):
    doc_nodes = [TextNode.from_dict(d) for d in nodes]
    summary_index = SummaryIndex(doc_nodes)
    summary_query_engine = summary_index.as_query_engine(
    response_mode="tree_summarize",
    )
    response = summary_query_engine.query("Summarize the given document")
    vector_store.add(index._get_node_with_embedding([TextNode(text=str(response), metadata={'chat_id': chat_id, 'node_type': 'summary'})]))


    
# When document is uploaded to chat, it should be added to the index
def add_document_to_index(document_path: str, chat_id: int):
    # Get document file back from minio
    file = download_from_minio(filename=str(document_path), bucket_name=BUCKET_NAME)
    if not file:
        return False
    # Break it to chunks with docling
    
    chunks = get_chunks(str(document_path), file)
    if not chunks:
        return False

    nodes = []
    for chunk in chunks:
        node = TextNode(text=chunk['text'], metadata={'chat_id': chat_id})
        nodes.append(node)

    nodes_with_embeddings = index._get_node_with_embedding(nodes)
    # Chunks to text nodes
    vector_store.add(nodes_with_embeddings)
    nodes_as_dicts = [node.dict() for node in nodes]
    from app.tasks.tasks import add_summary_task

    add_summary_task.delay(nodes_as_dicts, chat_id)
    return True

# Deletes all nodes with metadata key chat_id
def clear_documents_in_chat(chat_id: int):
    # Get all nodes with chat_id
    filters = MetadataFilters(
        filters=[
            MetadataFilter(key="chat_id", value=chat_id)],
    )

    nodes = vector_store.get_nodes(node_ids=None, filters=filters)

    node_ids = [node.node_id for node in nodes]

    vector_store.delete_nodes(node_ids=node_ids)

def query_rag(query: str, chat_id: int, message_id: int, messages: list[dict]):
    filters = MetadataFilters(
        filters=[
            MetadataFilter(key="chat_id", value=chat_id)],
    )
    retriever = index.as_retriever(filters=filters, similarity_top_k=5)

    # Create chat history from messages
    custom_chat_history = []
    for message in messages:
        if message['type'] == 'agentic':
            custom_chat_history.append(ChatMessage(role=MessageRole.ASSISTANT, content=message['content']))
        else:
            custom_chat_history.append(ChatMessage(role=MessageRole.USER, content=message['content']))

    chat_engine = ContextChatEngine.from_defaults(
        retriever=retriever,
        chat_history=custom_chat_history,
        )
    response = chat_engine.chat(query)


    nodes_for_output = []
    for node in response.source_nodes:
        nodes_for_output.append({'node': node.node.text, 'score': node.score })

    with session_scope() as session:
        message = finish_message(session=session, content=str(response), message_id=message_id, source_nodes=nodes_for_output)

    return message
