"""
Shared embedding service with retry and provider-safe parsing.
"""
from __future__ import annotations

from typing import Any
import logging

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from config import GEMINI_API_KEY, GEMINI_EMBED_MODEL, GEMINI_EMBED_MODEL_FALLBACKS

genai.configure(api_key=GEMINI_API_KEY)

log = logging.getLogger(__name__)
_WORKING_EMBED_MODEL: str | None = None


def _normalize_embedding_payload(payload: Any) -> list[list[float]]:
    """Normalize SDK embedding response into list[list[float]]."""
    emb = payload["embedding"]
    if not emb:
        return []
    if isinstance(emb[0], float):
        return [list(emb)]
    return [list(v) for v in emb]


def _candidate_models() -> list[str]:
    """Build ordered candidate model list, with configured primary first."""
    models = [GEMINI_EMBED_MODEL.strip()]
    if GEMINI_EMBED_MODEL_FALLBACKS.strip():
        models.extend(m.strip() for m in GEMINI_EMBED_MODEL_FALLBACKS.split(",") if m.strip())
    # Keep order, remove duplicates.
    deduped: list[str] = []
    seen: set[str] = set()
    for model in models:
        if model and model not in seen:
            deduped.append(model)
            seen.add(model)
    return deduped


@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
    retry=retry_if_exception_type(Exception),
)
def embed_texts(texts: list[str], task_type: str = "retrieval_document") -> list[list[float]]:
    """
    Embed input texts using configured Gemini embedding model.
    Returns an empty list for empty input.
    """
    if not texts:
        return []

    global _WORKING_EMBED_MODEL

    candidates = [*_candidate_models()]
    if _WORKING_EMBED_MODEL:
        # Optimistic fast path for known-good model.
        candidates = [_WORKING_EMBED_MODEL] + [m for m in candidates if m != _WORKING_EMBED_MODEL]

    last_exc: Exception | None = None
    for model in candidates:
        try:
            result = genai.embed_content(
                model=model,
                content=texts,
                task_type=task_type,
            )
            if _WORKING_EMBED_MODEL != model:
                log.info("Using embedding model: %s", model)
            _WORKING_EMBED_MODEL = model
            return _normalize_embedding_payload(result)
        except Exception as exc:
            last_exc = exc
            msg = str(exc).lower()
            # Keep trying next candidates for model availability issues.
            if "not found" in msg or "not supported" in msg or "404" in msg:
                log.warning("Embedding model unavailable: %s", model)
                continue
            # For non-model errors (e.g., auth/network), fail fast.
            raise

    if last_exc is not None:
        raise last_exc
    raise RuntimeError("No embedding models configured")
