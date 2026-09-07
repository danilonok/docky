from llama_index.core import SummaryIndex
from llama_index.core.chat_engine import ContextChatEngine
from llama_index.core.llms import ChatMessage, MessageRole
from llama_index.core.schema import TextNode
from llama_index.core.vector_stores.types import (
    MetadataFilter,
    MetadataFilters,
)

from app.config import get_settings
from app.dependencies.database import session_scope
from app.providers.llama_index import get_index, get_llm
from app.providers.parsers import get_parser
from app.services.messages import finish_message
from app.storage.minio_client import download_from_minio


def add_summary(nodes: list[dict], chat_id: int):
    index = get_index()
    doc_nodes = [TextNode.from_dict(d) for d in nodes]
    summary_index = SummaryIndex(doc_nodes)
    summary_query_engine = summary_index.as_query_engine(
    response_mode="tree_summarize",
    llm=get_llm(),
    )
    response = summary_query_engine.query("Summarize the given document")
    index.vector_store.add(index._get_node_with_embedding([TextNode(text=str(response), metadata={'chat_id': chat_id, 'node_type': 'summary'})]))



# When document is uploaded to chat, it should be added to the index
def add_document_to_index(document_path: str, chat_id: int):
    # Get document file back from minio
    file = download_from_minio(filename=str(document_path), bucket_name=get_settings().s3_bucket)
    if not file:
        return False
    # Break it to chunks with the configured parser

    chunks = get_parser().parse(str(document_path), file)
    if not chunks:
        return False

    nodes = []
    for chunk in chunks:
        node = TextNode(text=chunk, metadata={'chat_id': chat_id})
        nodes.append(node)

    index = get_index()
    nodes_with_embeddings = index._get_node_with_embedding(nodes)
    # Chunks to text nodes
    index.vector_store.add(nodes_with_embeddings)
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

    vector_store = get_index().vector_store

    nodes = vector_store.get_nodes(node_ids=None, filters=filters)

    node_ids = [node.node_id for node in nodes]

    vector_store.delete_nodes(node_ids=node_ids)

def query_rag(query: str, chat_id: int, message_id: int, messages: list[dict]):
    filters = MetadataFilters(
        filters=[
            MetadataFilter(key="chat_id", value=chat_id)],
    )
    retriever = get_index().as_retriever(filters=filters, similarity_top_k=5)

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
        llm=get_llm(),
        )
    response = chat_engine.chat(query)


    nodes_for_output = []
    for node in response.source_nodes:
        nodes_for_output.append({'node': node.node.text, 'score': node.score })

    with session_scope() as session:
        message = finish_message(session=session, content=str(response), message_id=message_id, source_nodes=nodes_for_output)

    return message
