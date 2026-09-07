"""Central application configuration.

Runtime knobs are read from the environment here, once, instead of via scattered
`os.environ` lookups. Modules should call `get_settings()`.

Only the inference and `nodes.py` settings live here so far — Postgres, MinIO and
the auth secret are still read directly in their own modules.
"""

from enum import StrEnum
from functools import lru_cache
from typing import Any, Self

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Provider(StrEnum):
    """Where inference is served from."""

    OLLAMA = "ollama"
    #: Any OpenAI-compatible chat/embeddings endpoint — DeepSeek, Azure AI Foundry, ...
    OPENAI_COMPATIBLE = "openai_compatible"


class DocumentParser(StrEnum):
    """How an uploaded document is turned into chunks."""

    #: The self-hosted docling-serve container. Layout-aware, reads scans and
    #: office formats. Costs ~17 GB of image and ~2.7 GiB of resident memory.
    DOCLING = "docling"
    #: In-process text extraction plus a token splitter. No service, no models,
    #: but PDFs with a text layer only.
    PYPDFIUM = "pypdfium"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- Generation -------------------------------------------------------
    llm_provider: Provider = Provider.OLLAMA
    llm_model: str = "gemma3:1b-it-q4_K_M"
    llm_api_base: str | None = None
    llm_api_key: SecretStr | None = None
    llm_context_window: int = 4000
    llm_max_tokens: int | None = None
    llm_timeout: float = 120.0

    # --- Embeddings -------------------------------------------------------
    # Kept separate from generation on purpose: DeepSeek serves no embeddings
    # endpoint, so the usual deployment is an API for generation and a local
    # model for embeddings.
    embedding_provider: Provider = Provider.OLLAMA
    embedding_model: str = "embeddinggemma"
    embedding_api_base: str | None = None
    embedding_api_key: SecretStr | None = None
    embedding_timeout: float = 120.0

    # --- Document parsing -------------------------------------------------
    document_parser: DocumentParser = DocumentParser.DOCLING
    docling_do_ocr: bool = True
    docling_timeout: float = 300.0
    #: Only used by the pypdfium parser; docling does its own chunking.
    chunk_size: int = 1024
    chunk_overlap: int = 200

    # --- Service hosts ----------------------------------------------------
    ollama_host: str = "localhost"
    qdrant_host: str = "localhost"
    docling_host: str = "localhost"

    qdrant_collection: str = "documents"
    s3_bucket: str = "my-bucket"

    @property
    def ollama_url(self) -> str:
        return f"http://{self.ollama_host}:11434"

    @property
    def qdrant_url(self) -> str:
        return f"http://{self.qdrant_host}:6333"

    @property
    def docling_chunk_url(self) -> str:
        return f"http://{self.docling_host}:5001/v1/chunk/hybrid/file"

    @model_validator(mode="before")
    @classmethod
    def _empty_is_unset(cls, data: Any) -> Any:
        """Treat an empty environment variable as absent.

        Compose and GitHub Actions interpolate `${VAR}` to an empty string when
        the variable is not defined. Without this, a deployment that does not set
        `LLM_MODEL` would get `""` instead of the default, and one that does not
        set `LLM_CONTEXT_WINDOW` would fail to parse `""` as an int.
        """
        if isinstance(data, dict):
            return {key: value for key, value in data.items() if value != ""}
        return data

    @model_validator(mode="after")
    def _require_api_credentials(self) -> Self:
        """An OpenAI-compatible provider is unusable without a base URL and a key.

        Checked at construction so a misconfigured deployment fails at startup
        rather than on the first user message, several minutes into a Celery task.
        """
        for role in ("llm", "embedding"):
            if getattr(self, f"{role}_provider") is not Provider.OPENAI_COMPATIBLE:
                continue
            for field in ("api_base", "api_key"):
                if getattr(self, f"{role}_{field}") is None:
                    raise ValueError(
                        f"{role.upper()}_{field.upper()} is required when "
                        f"{role.upper()}_PROVIDER is {Provider.OPENAI_COMPATIBLE}"
                    )
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
