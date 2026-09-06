"""Lazily-built LlamaIndex components, selected by configuration.

Nothing is constructed at import time: importing this module — or anything that
depends on it — does not open a connection or require a reachable provider.

The two public factories are cached because the objects behind them hold HTTP
connection pools, and we want one of each per process rather than one per call.
"""

from functools import cache

import qdrant_client
from llama_index.core.base.embeddings.base import BaseEmbedding
from llama_index.core.indices.vector_store.base import VectorStoreIndex
from llama_index.core.llms import LLM
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.ollama import Ollama
from llama_index.llms.openai_like import OpenAILike
from llama_index.vector_stores.qdrant import QdrantVectorStore

from app.config import Provider, Settings, get_settings


@cache
def get_llm() -> LLM:
    settings = get_settings()

    if settings.llm_provider is Provider.OLLAMA:
        return Ollama(
            model=settings.llm_model,
            base_url=settings.ollama_url,
            context_window=settings.llm_context_window,
            request_timeout=settings.llm_timeout,
        )

    # OpenAILike rather than OpenAI: the latter validates the model name against
    # a hardcoded list of OpenAI models and rejects everything else.
    return OpenAILike(
        model=settings.llm_model,
        api_base=settings.llm_api_base,
        api_key=settings.llm_api_key.get_secret_value(),
        context_window=settings.llm_context_window,
        max_tokens=settings.llm_max_tokens,
        timeout=settings.llm_timeout,
        is_chat_model=True,
    )


def _build_embed_model(settings: Settings) -> BaseEmbedding:
    """Only ever called by `get_index`, which owns the single instance."""
    if settings.embedding_provider is Provider.OLLAMA:
        return OllamaEmbedding(
            model_name=settings.embedding_model,
            base_url=settings.ollama_url,
            request_timeout=settings.embedding_timeout,
        )

    return OpenAIEmbedding(
        model_name=settings.embedding_model,
        api_base=settings.embedding_api_base,
        api_key=settings.embedding_api_key.get_secret_value(),
        timeout=settings.embedding_timeout,
    )


@cache
def get_index() -> VectorStoreIndex:
    """The vector index, and via `index.vector_store` the store underneath it."""
    settings = get_settings()

    vector_store = QdrantVectorStore(
        client=qdrant_client.QdrantClient(settings.qdrant_url, api_key=None),
        collection_name=settings.qdrant_collection,
    )
    return VectorStoreIndex.from_vector_store(
        vector_store=vector_store,
        embed_model=_build_embed_model(settings),
    )
