"""
Central configuration loaded from .env.
All other modules import from here — never call os.environ directly.
"""
import os
from dotenv import load_dotenv

# Walk up to find .env (supports running from backend/ or repo root)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv()  # fallback: load from CWD

SUPABASE_URL: str = os.environ["SUPABASE_URL"].strip()
SUPABASE_SERVICE_KEY: str = os.environ["SUPABASE_SERVICE_KEY"].strip()
GEMINI_API_KEY: str = os.environ["GEMINI_API_KEY"].strip()

GEMINI_MODEL_FAST: str = os.getenv("GEMINI_MODEL_FAST", "gemini-1.5-flash")
# Use a broadly available default model to avoid NOT_FOUND on some accounts/regions.
GEMINI_MODEL_STRONG: str = os.getenv("GEMINI_MODEL_STRONG", "gemini-1.5-flash")
GEMINI_EMBED_MODEL: str = os.getenv("GEMINI_EMBED_MODEL", "models/text-embedding-004")
# Comma-separated fallback list for embedding model routing.
# Example: "models/text-embedding-004,models/embedding-001"
GEMINI_EMBED_MODEL_FALLBACKS: str = os.getenv("GEMINI_EMBED_MODEL_FALLBACKS", "")

SIMULATE_FAILURES: bool = os.getenv("SIMULATE_FAILURES", "true").lower() == "true"
SUPABASE_BUCKET: str = os.getenv("SUPABASE_BUCKET", "saas-files")

# FAISS index persistence path
FAISS_INDEX_PATH: str = os.getenv("FAISS_INDEX_PATH", "faiss_index.bin")
FAISS_META_PATH: str = os.getenv("FAISS_META_PATH", "faiss_meta.json")

# Similarity thresholds
FAISS_SIMILARITY_THRESHOLD: float = float(os.getenv("FAISS_SIMILARITY_THRESHOLD", "0.88"))
