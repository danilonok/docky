import io
from docling.datamodel.base_models import InputFormat
from docling.document_converter import DocumentConverter, DocumentStream
from docling.chunking import HierarchicalChunker

from app.storage.minio_client import download_from_minio

# 1. Prepare your BytesIO object (example)
pdf_bytes = download_from_minio(bucket_name='my-bucket', filename='user-1/documents/e94ff99d-4462-4761-a130-dd1305ca6913.pdf')

# 2. Initialize the Converter
converter = DocumentConverter()

# 3. Convert from stream
# We wrap the BytesIO in a DocumentStream and specify the format
source = DocumentStream(name="my_document.pdf", stream=pdf_bytes)
result = converter.convert(source)

# 4. Initialize the Chunker
# HierarchicalChunker respects the document's structure (headers, sections)
chunker = HierarchicalChunker()

# 5. Generate Chunks
chunks = list(chunker.chunk(result.document))

# 6. Inspect a chunk
for i, chunk in enumerate(chunks[:3]):
    print(f"--- Chunk {i} ---")
    print(f"Text: {chunker.serialize(chunk)[:150]}...") # Clean text representation