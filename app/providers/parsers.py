"""Document parsers, selected by configuration.

Two strategies behind one contract: file bytes in, chunks out.

- `docling` calls the self-hosted docling-serve container, which does its own
  layout-aware chunking and can read scans and office formats.
- `pypdfium` extracts the PDF's existing text layer in-process and splits it
  with a token splitter. No service and no models, at the cost of scans,
  tables and non-PDF formats.

A parser returns `[]` for anything it could not read; callers treat that the
same way regardless of which strategy is active.

Each chunk carries the page it came from where the strategy can tell. That page
is what a citation in the UI points at, so it is worth the extra bookkeeping —
but it stays optional: a parser that cannot attribute a chunk reports `None`
rather than guessing.
"""

from dataclasses import dataclass
from functools import cache
from io import BytesIO
from typing import Any, Protocol

import pypdfium2 as pdfium
import requests
from llama_index.core.node_parser import SentenceSplitter

from app.config import DocumentParser, Settings, get_settings


@dataclass(frozen=True, slots=True)
class Chunk:
    """One indexable passage, and where in the document it came from."""

    text: str
    #: 1-based page number, or None when the parser cannot attribute the text.
    page: int | None = None


class Parser(Protocol):
    def parse(self, filename: str, stream: BytesIO) -> list[Chunk]:
        """Return the document's chunks, or `[]` if it could not be read."""
        ...


def _first_page(chunk: dict[str, Any]) -> int | None:
    """The earliest page a docling chunk touches.

    A chunk is built from one or more doc items, each carrying its own
    provenance, and a single chunk can straddle a page break. The first page is
    the one to cite: it is where a reader following the reference starts.

    Written defensively — this walks a JSON payload from another service, and a
    missing page is a degraded citation, not a failed upload.
    """
    meta = chunk.get("meta")
    if not isinstance(meta, dict):
        return None

    pages = [
        prov["page_no"]
        for item in meta.get("doc_items") or []
        if isinstance(item, dict)
        for prov in item.get("prov") or []
        if isinstance(prov, dict) and isinstance(prov.get("page_no"), int)
    ]
    return min(pages) if pages else None


class DoclingParser:
    """Delegates parsing and chunking to a docling-serve instance."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def parse(self, filename: str, stream: BytesIO) -> list[Chunk]:
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

        chunks = [
            Chunk(text=chunk["text"], page=_first_page(chunk))
            for chunk in result["chunks"]
        ]
        attributed = sum(1 for chunk in chunks if chunk.page is not None)
        print(
            f"Successfully processed! Found {len(chunks)} chunks "
            f"({attributed} with a page number)."
        )
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

    def parse(self, filename: str, stream: BytesIO) -> list[Chunk]:
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

        if not any(page.strip() for page in pages):
            print(f"No text layer in {filename} — a scan needs OCR, not extraction.")
            return []

        # Split page by page rather than over the concatenated document. A chunk
        # can then name the page it came from, at the cost of never spanning a
        # page break — which also stops a chunk from being attributed to a page
        # that supplied only its last sentence.
        chunks = [
            Chunk(text=text, page=number)
            for number, page in enumerate(pages, start=1)
            if page.strip()
            for text in self._splitter.split_text(page)
        ]
        print(f"Extracted {len(pages)} pages into {len(chunks)} chunks.")
        return chunks


@cache
def get_parser() -> Parser:
    settings = get_settings()
    if settings.document_parser is DocumentParser.DOCLING:
        return DoclingParser(settings)
    return PyPdfiumParser(settings)
