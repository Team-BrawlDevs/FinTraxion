"""
LLM Router — returns pre-configured ChatGoogleGenerativeAI instances.

  fast_llm()   → gemini-1.5-flash  (extraction, normalization, enrichment)
  strong_llm() → gemini-1.5-pro    (decision_node — structured reasoning)
"""
from functools import lru_cache

from langchain_google_genai import ChatGoogleGenerativeAI

from config import GEMINI_API_KEY, GEMINI_MODEL_FAST, GEMINI_MODEL_STRONG


@lru_cache(maxsize=2)
def fast_llm() -> ChatGoogleGenerativeAI:
    """Small, fast model for extraction tasks."""
    return ChatGoogleGenerativeAI(
        model=GEMINI_MODEL_FAST,
        google_api_key=GEMINI_API_KEY,
        temperature=0.1,
        convert_system_message_to_human=True,
    )


@lru_cache(maxsize=2)
def strong_llm() -> ChatGoogleGenerativeAI:
    """Strong model for high-stakes decision reasoning."""
    return ChatGoogleGenerativeAI(
        model=GEMINI_MODEL_STRONG,
        google_api_key=GEMINI_API_KEY,
        temperature=0.2,
        convert_system_message_to_human=True,
    )
