"""
RAG (Retrieval-Augmented Generation) module for the mental health support chatbot.
Retrieves relevant knowledge base content to ground responses in evidence-based information.
"""

import os
import logging
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
load_dotenv()

from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

# Default paths
BACKEND_DIR = Path(__file__).resolve().parent
KNOWLEDGE_DIR = BACKEND_DIR / "knowledge"
CHROMA_PERSIST_DIR = BACKEND_DIR / "chroma_db"
COLLECTION_NAME = "mental_health_knowledge"


class RAGRetriever:
    """
    Retrieval-Augmented Generation: embeds and retrieves relevant chunks
    from a mental health knowledge base.
    """

    def __init__(
        self,
        persist_directory: Optional[str] = None,
        collection_name: str = COLLECTION_NAME,
        embedding_model: str = "text-embedding-3-small",
        chunk_size: int = 500,
        chunk_overlap: int = 80,
    ):
        self.persist_directory = persist_directory or str(CHROMA_PERSIST_DIR)
        self.collection_name = collection_name
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        self.embeddings = OpenAIEmbeddings(
            model=embedding_model,
            api_key=os.getenv("OPENAI_API_KEY"),
        )

        self._vector_store: Optional[Chroma] = None
        self._text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def _get_vector_store(self) -> Chroma:
        """Lazy-load Chroma vector store (from disk if exists)."""
        if self._vector_store is None:
            self._vector_store = Chroma(
                collection_name=self.collection_name,
                embedding_function=self.embeddings,
                persist_directory=self.persist_directory,
            )
            logger.info(
                "RAG vector store loaded from %s (collection: %s)",
                self.persist_directory,
                self.collection_name,
            )
        return self._vector_store

    def add_documents(self, documents: List[Document]) -> None:
        """
        Add documents to the vector store (chunk and embed).
        Used by the ingestion script.
        """
        if not documents:
            logger.warning("No documents to add")
            return
        chunks = self._text_splitter.split_documents(documents)
        store = self._get_vector_store()
        store.add_documents(chunks)
        logger.info("Added %d chunks from %d documents", len(chunks), len(documents))

    def add_documents_prechunked(self, documents: List[Document]) -> None:
        """
        Add documents that are already chunked.

        This is useful when each document is a logical unit that should not be
        further split by the text splitter (e.g. one context + one response pair
        from a structured JSON knowledge file).
        """
        if not documents:
            logger.warning("No pre-chunked documents to add")
            return
        store = self._get_vector_store()
        store.add_documents(documents)
        logger.info("Added %d pre-chunked documents", len(documents))

    def retrieve(
        self,
        query: str,
        k: int = 4,
    ) -> List[str]:
        """
        Retrieve the most relevant text chunks for a user query.

        Args:
            query: User message or question
            k: Maximum number of chunks to return

        Returns:
            List of chunk text strings to inject into the prompt
        """
        if not query or not query.strip():
            return []

        try:
            store = self._get_vector_store()
            results = store.similarity_search(query, k=k)
            return [doc.page_content for doc in results]
        except Exception as e:
            logger.error("RAG retrieval failed: %s", str(e))
            return []

    def retrieve_as_context(self, query: str, k: int = 4) -> str:
        """
        Retrieve relevant chunks and format as a single context string
        for inclusion in the system prompt.
        """
        chunks = self.retrieve(query, k=k)
 
        if not chunks:
            return ""
        return "\n\n---\n\n".join(chunks)


# Singleton for use across the app
_rag_retriever: Optional[RAGRetriever] = None


def get_rag_retriever() -> RAGRetriever:
    """Get or create the global RAG retriever instance."""
    global _rag_retriever
    if _rag_retriever is None:
        _rag_retriever = RAGRetriever()
    return _rag_retriever
