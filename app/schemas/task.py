from pydantic import BaseModel, Field


class IndexingTask(BaseModel):
    """Handle for the indexing job started by attaching a document to a chat."""

    chat_id: int
    document_id: int
    task_id: str | None = Field(
        default=None,
        description=(
            "Poll GET /tasks/{task_id} for progress. Null when the document was "
            "already attached to this chat and nothing was dispatched."
        ),
    )


class TaskStatus(BaseModel):
    task_id: str
    state: str = Field(
        description=(
            "PENDING, STARTED, SUCCESS, FAILURE or RETRY. Note that PENDING also "
            "covers an unknown task id: Celery cannot tell 'queued' from "
            "'never existed'."
        )
    )
    result: dict | None = Field(
        default=None, description="Present on SUCCESS: what the task produced."
    )
    error: str | None = Field(
        default=None, description="Present on FAILURE: why indexing could not finish."
    )
