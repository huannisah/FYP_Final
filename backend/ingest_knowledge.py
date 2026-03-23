#!/usr/bin/env python3
"""
Ingest knowledge base documents into the RAG vector store (Chroma).

"""

import shutil
import sys
import json
from pathlib import Path
from langchain_core.documents import Document
from rag import RAGRetriever, KNOWLEDGE_DIR, CHROMA_PERSIST_DIR

# Ensure backend is on path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

def load_documents_from_directory(directory: Path) -> list[Document]:
    """Load all .md and .txt files from a directory as LangChain Documents."""
    documents = []
    if not directory.exists():
        print(f"Knowledge directory not found: {directory}")
        return documents

    for path in sorted(directory.iterdir()):
        if path.suffix.lower() not in (".md", ".txt"):
            continue
        try:
            text = path.read_text(encoding="utf-8")
            if not text.strip():
                continue
            doc = Document(
                page_content=text,
                metadata={"source": str(path.name)},
            )
            documents.append(doc)
            print(f"  Loaded: {path.name}")
        except Exception as e:
            print(f"  Skipped {path.name}: {e}")

    return documents


def load_documents_from_json_files(directory: Path) -> list[Document]:
    """
    Load JSON knowledge files where each item contains a context/response pair.

    Expected JSON formats (either of these):
    1) List of objects:
       [
         { "context": "...", "response": "..." },
         { "context": "...", "response": "..." }
       ]
    2) Object with a top-level "items" array:
       {
         "items": [
           { "context": "...", "response": "..." },
           ...
         ]
       }

    Each context+response pair becomes ONE LangChain Document so that the RAG
    retriever stores them as single chunks.
    """
    documents: list[Document] = []

    if not directory.exists():
        print(f"Knowledge directory not found: {directory}")
        return documents

    json_paths = sorted(p for p in directory.iterdir() if p.suffix.lower() == ".json")
    if not json_paths:
        return documents

    for path in json_paths:
        try:
            raw = path.read_text(encoding="utf-8")
            if not raw.strip():
                continue

            items: list[dict] = []

            # Case 1: standard JSON (list or object with "items")
            try:
                data = json.loads(raw)
                if isinstance(data, dict) and "items" in data and isinstance(data["items"], list):
                    items = data["items"]
                elif isinstance(data, list):
                    items = data
            except json.JSONDecodeError:
            # Case 2: JSON Lines / multiple JSON objects separated by newlines
                pass

            if not items:
                # Try to interpret as JSONL (one JSON object per line)
                for line in raw.splitlines():
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        obj = json.loads(line)
                        if isinstance(obj, dict):
                            items.append(obj)
                    except json.JSONDecodeError:
                        continue

            if not items:
                print(f"  Skipped {path.name}: unsupported JSON structure")
                continue

            start_index = len(documents)
            for idx, item in enumerate(items):
                if not isinstance(item, dict):
                    continue

                # Support multiple key casings / aliases
                context = (
                    item.get("context")
                    or item.get("Context")
                    or item.get("question")
                    or item.get("Question")
                    or ""
                )
                response = (
                    item.get("response")
                    or item.get("Response")
                    or item.get("answer")
                    or item.get("Answer")
                    or ""
                )

                combined = (str(context) or "").strip()
                if response:
                    if combined:
                        combined += "\n\nAssistant response:\n" + str(response).strip()
                    else:
                        combined = str(response).strip()

                if not combined:
                    continue

                doc = Document(
                    page_content=combined,
                    metadata={
                        "source": str(path.name),
                        "index": start_index + idx,
                    },
                )
                documents.append(doc)

            print(f"  Loaded {len(documents) - start_index} items from {path.name}")
        except Exception as e:
            print(f"  Skipped {path.name}: {e}")

    return documents


def main():
    print("Loading documents from", KNOWLEDGE_DIR)

    # Prefer JSON knowledge files (context/response pairs) if present.
    json_documents = load_documents_from_json_files(KNOWLEDGE_DIR)
    if json_documents:
        documents = json_documents
        use_prechunked = True
        print(f"Using JSON knowledge files. Loaded {len(documents)} context/response pairs.")
    else:
        documents = load_documents_from_directory(KNOWLEDGE_DIR)
        use_prechunked = False

    if not documents:
        print("No documents found. Add JSON, .md or .txt files to backend/knowledge/")
        return 1

    # Clear existing vector store so this run is a full re-ingest
    if CHROMA_PERSIST_DIR.exists():
        shutil.rmtree(CHROMA_PERSIST_DIR)
        print("Cleared existing vector store.")

    if use_prechunked:
        print(f"Loaded {len(documents)} pre-chunked JSON item(s). Embedding...")
    else:
        print(f"Loaded {len(documents)} document(s). Chunking and embedding...")

    retriever = RAGRetriever()
    if use_prechunked:
        retriever.add_documents_prechunked(documents)
    else:
        retriever.add_documents(documents)
    print("Done. Vector store saved to:", retriever.persist_directory)
    return 0


if __name__ == "__main__":
    exit(main())
