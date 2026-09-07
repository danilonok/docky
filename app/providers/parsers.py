"""Document parsers, selected by configuration.

Two strategies behind one contract: file bytes in, chunk texts out.

- `docling` calls the self-hosted docling-serve container, which does its own
  layout-aware chunking and can read scans and office formats.
- `pypdfium` extracts the PDF's existing text layer in-process and splits it
  with a token splitter. No service and no models, at the cost of scans,
  tables and non-PDF formats.

A parser returns `[]` for anything it could not read; callers treat that the
same way regardless of which strategy is active.
"""

from functools import cache
from io import BytesIO
from typing import Protocol

import pypdfium2 as pdfium
import requests
from llama_index.core.node_parser import SentenceSplitter

from app.config import DocumentParser, Settings, get_settings


class Parser(Protocol):
    def parse(self, filename: str, stream: BytesIO) -> list[str]:
        """Return the document's chunk texts, or `[]` if it could not be read."""
        ...


class DoclingParser:
    """Delegates parsing and chunking to a docling-serve instance."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def parse(self, filename: str, stream: BytesIO) -> list[str]:
        stream.seek(0)
        files = [("files", (filename, stream, "application/pdf"))]
        data = {
            "include_converted_doc": "true",
            "convert_do_ocr": str(self._settings.docling_do_ocr).lower(),
            "target_type": "inbody",
            "chunking_merge_peers": "true",
        }

        try:
            response = requests.post(
                self._settings.docling_chunk_url,
                files=files,
                data=data,
                timeout=self._settings.docling_timeout,
            )
        except requests.RequestException as error:
            print(f"Connection Error: {error}")
            return []

        if response.status_code != 200:
            print(f"HTTP {response.status_code}: {response.text}")
            return []

        result = response.json()
        document = result["documents"][0]
        if document["status"] != "success":
            print(f"Server rejected the file. Errors: {document.get('errors')}")
            return []

        chunks = [chunk["text"] for chunk in result["chunks"]]
        print(f"Successfully processed! Found {len(chunks)} chunks.")
        return chunks


class PyPdfiumParser:
    """Reads the PDF's own text layer, then splits it into chunks.

    Returns `[]` for a scanned PDF: PDFium reports no text because there is
    none to report, and recognising the pixels is what OCR is for.
    """

    def __init__(self, settings: Settings) -> None:
        self._splitter = SentenceSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
        )

    def parse(self, filename: str, stream: BytesIO) -> list[str]:
        stream.seek(0)
        try:
            document = pdfium.PdfDocument(stream)
        except pdfium.PdfiumError as error:
            print(f"Could not open {filename}: {error}")
            return []

        try:
            pages = [page.get_textpage().get_text_range() for page in document]
        finally:
            document.close()

        text = "\n\n".join(page for page in pages if page.strip())
        if not text.strip():
            print(f"No text layer in {filename} — a scan needs OCR, not extraction.")
            return []

        chunks = self._splitter.split_text(text)
        print(f"Extracted {len(pages)} pages into {len(chunks)} chunks.")
        return chunks


@cache
def get_parser() -> Parser:
    settings = get_settings()
    if settings.document_parser is DocumentParser.DOCLING:
        return DoclingParser(settings)
    return PyPdfiumParser(settings)
