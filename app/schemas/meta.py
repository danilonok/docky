from pydantic import BaseModel, Field


class ServerInfo(BaseModel):
    """What the deployment is running, for the client to display.

    Configuration, not secrets: model names and the parser choice. Anything that
    identifies a host or carries a credential stays out of this response.
    """

    llm_model: str = Field(description="Model answering questions, e.g. 'gemma3:1b'.")
    embedding_model: str = Field(description="Model producing the vectors.")
    document_parser: str = Field(
        description="How uploads are turned into chunks: 'docling' or 'pypdfium'."
    )
