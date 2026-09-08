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

#: Bookkeeping that exists to filter and to cite, not to be read. Embedding it
#: would put "chat_id: 5" into the vector and let an id drift a passage's
#: meaning; the retriever matches on the passage alone.
EMBED_EXCLUDED_METADATA = ["chat_id", "document_id", "document_name", "page"]

#: The model, unlike the embedder, benefits from knowing which document and page
#: a passage came from — that is what lets it attribute an answer. Only the
#: internal ids are withheld.
LLM_EXCLUDED_METADATA = ["chat_id", "document_id"]


class IndexingError(RuntimeError):
    """Indexing could not finish, with a reason worth showing the user.

    Raised rather than returned: a Celery task that returns False is
    recorded as SUCCESS, so the failure would never reach anyone.
    """


def _build_node(text: str, metadata: dict) -> TextNode:
    """A node carrying its provenance, with that provenance kept out of the vector."""
    return TextNode(
        text=text,
        metadata=metadata,
        excluded_embed_metadata_keys=list(EMBED_EXCLUDED_METADATA),
        excluded_llm_metadata_keys=list(LLM_EXCLUDED_METADATA),
    )


def add_summary(nodes: list[dict], chat_id: int):
    index = get_index()
    doc_nodes = [TextNode.from_dict(d) for d in nodes]
    summary_index = SummaryIndex(doc_nodes)
    summary_query_engine = summary_index.as_query_engine(
    response_mode="tree_summarize",
    llm=get_llm(),
    )
    response = summary_query_engine.query("Summarize the given document")

    # The summary describes one document, so it inherits that document's
    # identity from the nodes it was built from. Read rather than passed, so the
    # task signature — and anything already queued against it — stays as it is.
    source = doc_nodes[0].metadata if doc_nodes else {}
    metadata = {
        'chat_id': chat_id,
        'document_id': source.get('document_id'),
        'document_name': source.get('document_name'),
        'node_type': 'summary',
    }
    index.vector_store.add(
        index._get_node_with_embedding([_build_node(str(response), metadata)])
    )



# When document is uploaded to chat, it should be added to the index
def add_document_to_index(
    document_path: str,
    chat_id: int,
    document_id: int | None = None,
    document_name: str | None = None,
) -> dict:
    """Index one document into one chat.

    `document_id` and `document_name` default to None so that a task queued by
    an older release — which passed neither — still runs to completion instead
    of dying in the worker. Such a document indexes fine; it just cannot be
    named in a citation.
    """
    # Get document file back from minio
    file = download_from_minio(filename=str(document_path), bucket_name=get_settings().s3_bucket)
    if not file:
        raise IndexingError(f"{document_path} is not in object storage")
    # Break it to chunks with the configured parser

    chunks = get_parser().parse(str(document_path), file)
    if not chunks:
        raise IndexingError(
            f"No text could be extracted from {document_path}. A scanned PDF "
            f"needs OCR, which the {get_settings().document_parser} parser does not do."
        )

    nodes = []
    for chunk in chunks:
        metadata = {
            'chat_id': chat_id,
            'document_id': document_id,
            'document_name': document_name,
            'page': chunk.page,
        }
        nodes.append(_build_node(chunk.text, metadata))

    index = get_index()
    nodes_with_embeddings = index._get_node_with_embedding(nodes)
    # Chunks to text nodes
    index.vector_store.add(nodes_with_embeddings)
    nodes_as_dicts = [node.dict() for node in nodes]
    from app.tasks.tasks import add_summary_task

    add_summary_task.delay(nodes_as_dicts, chat_id)

    pages = [chunk.page for chunk in chunks if chunk.page is not None]
    return {
        "document_path": document_path,
        "document_id": document_id,
        "document_name": document_name,
        "chat_id": chat_id,
        "chunks": len(nodes),
        # The highest page any chunk came from — the document's length as far as
        # indexing saw it. None when the parser attributed nothing.
        "pages": max(pages) if pages else None,
    }

# Deletes all nodes with metadata key chat_id
def clear_documents_in_chat(chat_id: int):
    # Get all nodes with metadata key chat_id
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
        # `node` and `score` come first and keep their names: messages indexed
        # before this change are already stored with those two keys, and the
        # client reads them from both old and new rows.
        metadata = node.node.metadata or {}
        nodes_for_output.append({
            'node': node.node.text,
            'score': node.score,
            'document_id': metadata.get('document_id'),
            'document_name': metadata.get('document_name'),
            'page': metadata.get('page'),
        })

    with session_scope() as session:
        message = finish_message(session=session, content=str(response), message_id=message_id, source_nodes=nodes_for_output)

    return message
