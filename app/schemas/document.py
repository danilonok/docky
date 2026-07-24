from pydantic import BaseModel, ConfigDict, Field




class DocumentBase(BaseModel):
    bucket_name : str
    original_file_name: str
    extension: str
    file_name: str

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(DocumentBase):
    bucket_name : str | None = None
    original_file_name: str | None = None
    extension: str | None = None
    file_name: str | None = None


class DocumentRead(DocumentBase):
    id: int

    user_id: int | None = None

    model_config = ConfigDict(from_attributes=True)