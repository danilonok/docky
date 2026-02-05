from importlib import metadata
from llama_index.core import VectorStoreIndex
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

from docling.document_converter import DocumentConverter, DocumentStream
from docling.chunking import HierarchicalChunker

from llama_index.core.vector_stores.types import (
    MetadataFilter,
    MetadataFilters,
)

Settings.llm = Ollama(model="gemma3:4b", request_timeout=120.0, base_url="http://localhost:11434")
Settings.embed_model = OllamaEmbedding(model_name='embeddinggemma', request_timeout=120.0, base_url="http://localhost:11434")


BUCKET_NAME = 'my-bucket'


client = qdrant_client.QdrantClient(
    "http://localhost:6333",
    api_key=None, # For Qdrant Cloud, None for local instance
)

vector_store = QdrantVectorStore(client=client, collection_name="documents")
index = VectorStoreIndex.from_vector_store(vector_store=vector_store)


converter = DocumentConverter()
chunker = HierarchicalChunker()


# When document is uploaded to chat, it should be added to the index
def add_document_to_index(document_path: str, chat_id: int):
    # Get document file back from minio
    file = download_from_minio(filename=str(document_path), bucket_name=BUCKET_NAME)

    # Break it to chunks with docling
    source = DocumentStream(name=document_path, stream=file)
    result = converter.convert(source)

    chunks = list(chunker.chunk(result.document))

    nodes = []
    for chunk in chunks:
        node = TextNode(text=chunk.text, metadata={'chat_id': chat_id})
        nodes.append(node)

    nodes_with_embeddings = index._get_node_with_embedding(nodes)
    # Chunks to text nodes
    vector_store.add(nodes_with_embeddings)
    return True


# Should return a JSON object with response and top-3 nodes
# Also changes the content of the corresponding agentic message
def query_rag(query: str, chat_id: int, message_id: int):
    filters = MetadataFilters(
        filters=[
            MetadataFilter(key="chat_id", value=chat_id)],
    )
    query_engine = index.as_query_engine(filters=filters)
    response = query_engine.query(query)

    nodes_for_output = []
    for node in response.source_nodes:
        nodes_for_output.append(str(node.node.get_content()))

    query_response = {
        'response': str(response),
        'nodes': nodes_for_output
    }
    
    finish_message(content=str(response), message_id=message_id)

    return query_response



    # To-DO: somehow get BytesIO into text chunks


# 1: User adds new document to the service -> Break it down to nodes, mark as "their"


# 2: Vectorize the whole bunch of nodes -> Bad at big scale, unuseful waste of resources, as many docs are not used all the time
# OK for now, but maybe useful to store only the one in current use

# Document gets processed as soon as it was added to any chat

# 3: Tasks for retrieval -> User writes his prompt, which then is being processed by the QueryEngine. QueryEngine looks up only the nodes labeled with current user_id and chat_id