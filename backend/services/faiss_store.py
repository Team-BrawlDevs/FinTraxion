"""
FAISS vector store manager.

Wraps a flat L2 index with a metadata list (vendor names).
Supports build, search, save, load, and online updates.
"""
from __future__ import annotations

import json
import os
from typing import Optional

import numpy as np

import faiss

from config import FAISS_INDEX_PATH, FAISS_META_PATH

DEFAULT_EMBEDDING_DIM = 768


class FaissStore:
    def __init__(self, dim: int = DEFAULT_EMBEDDING_DIM):
        self.dim = dim
        self.index: faiss.IndexFlatIP = faiss.IndexFlatIP(dim)  # Inner product (cosine after normalisation)
        self.metadata: list[str] = []  # parallel list of labels

    # ── Build ─────────────────────────────────────────────────────────────────

    def add(self, labels: list[str], embeddings: list[list[float]]) -> None:
        """Add embeddings + labels to the index."""
        if not embeddings:
            return

        vecs = np.array(embeddings, dtype=np.float32)
        if vecs.ndim != 2:
            raise ValueError("Embeddings must be 2D list[list[float]]")

        # Rebuild empty index if dimension differs from configured default.
        if self.index.ntotal == 0 and vecs.shape[1] != self.dim:
            self.dim = int(vecs.shape[1])
            self.index = faiss.IndexFlatIP(self.dim)

        if vecs.shape[1] != self.dim:
            raise ValueError(
                f"Embedding dim mismatch: got {vecs.shape[1]}, expected {self.dim}"
            )

        # Normalise for cosine similarity via inner product
        faiss.normalize_L2(vecs)
        self.index.add(vecs)
        self.metadata.extend(labels)

    # ── Search ────────────────────────────────────────────────────────────────

    def search(self, query_embedding: list[float], top_k: int = 5) -> list[tuple[str, float]]:
        """
        Return top_k (label, cosine_similarity) pairs.
        Similarity is in [−1, 1]; higher = more similar.
        """
        if self.index.ntotal == 0:
            return []
        vec = np.array([query_embedding], dtype=np.float32)
        faiss.normalize_L2(vec)
        distances, indices = self.index.search(vec, min(top_k, self.index.ntotal))
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
            results.append((self.metadata[idx], float(dist)))
        return results

    # ── Persistence ───────────────────────────────────────────────────────────

    def save(self, index_path: str = FAISS_INDEX_PATH, meta_path: str = FAISS_META_PATH) -> None:
        faiss.write_index(self.index, index_path)
        with open(meta_path, "w") as f:
            json.dump(self.metadata, f)

    @classmethod
    def load(cls, index_path: str = FAISS_INDEX_PATH, meta_path: str = FAISS_META_PATH) -> "FaissStore":
        store = cls()
        if os.path.exists(index_path) and os.path.exists(meta_path):
            store.index = faiss.read_index(index_path)
            with open(meta_path) as f:
                store.metadata = json.load(f)
        return store

    # ── Utility ───────────────────────────────────────────────────────────────

    @property
    def size(self) -> int:
        return self.index.ntotal
