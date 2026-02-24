from importlib import metadata
from io import BytesIO
from httpx import delete
from llama_index.core import VectorStoreIndex
import requests
from app.dependencies.database import SessionDep
from app.models.document import Document

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

# from openinference.instrumentation.llama_index import LlamaIndexInstrumentor

# from phoenix.otel import register

# tracer_provider = register(project_name="llamaindex-tracing-tutorial", protocol="http/protobuf")
# LlamaIndexInstrumentor().instrument(
#     tracer_provider=tracer_provider,
# )


Settings.llm = Ollama(model="gemma3:4b", request_timeout=120.0, base_url="http://ollama:11434")
Settings.embed_model = OllamaEmbedding(model_name='embeddinggemma', request_timeout=120.0, base_url="http://ollama:11434")


BUCKET_NAME = 'my-bucket'


client = qdrant_client.QdrantClient(
    "http://qdrant:6333",
    api_key=None, # For Qdrant Cloud, None for local instance
)

vector_store = QdrantVectorStore(client=client, collection_name="documents")
index = VectorStoreIndex.from_vector_store(vector_store=vector_store)




EMBED_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"




def get_chunks(filename, filestream: BytesIO):
    url = "http://docling:5001/v1/chunk/hybrid/file"
    filestream.seek(0)

    files = [
        ('files', (filename, filestream, 'application/pdf'))
    ]

    # 3. Request Parameters
    data = {
        "include_converted_doc": "true",
        "convert_do_ocr": "true", # Set to false if you want it faster
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


    
# When document is uploaded to chat, it should be added to the index
def add_document_to_index(document_path: str, chat_id: int):
    # Get document file back from minio
    file = download_from_minio(filename=str(document_path), bucket_name=BUCKET_NAME)

    # Break it to chunks with docling
    
    chunks = get_chunks(str(document_path), file)


    nodes = []
    for chunk in chunks:
        node = TextNode(text=chunk['text'], metadata={'chat_id': chat_id})
        nodes.append(node)

    nodes_with_embeddings = index._get_node_with_embedding(nodes)
    # Chunks to text nodes
    vector_store.add(nodes_with_embeddings)
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

# Should return a JSON object with response and top-3 nodes
# Also changes the content of the corresponding agentic message
def query_rag(query: str, chat_id: int, message_id: int, messages: list[dict]):
    filters = MetadataFilters(
        filters=[
            MetadataFilter(key="chat_id", value=chat_id)],
    )
    # chat_engine = index.as_chat_engine()
    retriever = index.as_retriever(filters=filters)

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
    # response = query_engine.query(query)
    response = chat_engine.chat(query)


    nodes_for_output = []
    for node in response.source_nodes:
        nodes_for_output.append(str(node.node.get_content()))

    query_response = {
        'response': str(response),
        'nodes': nodes_for_output
    }
    
    message = finish_message(content=str(response), message_id=message_id)

    return message



    # To-DO: somehow get BytesIO into text chunks


# 1: User adds new document to the service -> Break it down to nodes, mark as "their"


# 2: Vectorize the whole bunch of nodes -> Bad at big scale, unuseful waste of resources, as many docs are not used all the time
# OK for now, but maybe useful to store only the one in current use

# Document gets processed as soon as it was added to any chat

# 3: Tasks for retrieval -> User writes his prompt, which then is being processed by the QueryEngine. QueryEngine looks up only the nodes labeled with current user_id and chat_id