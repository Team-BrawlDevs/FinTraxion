"""
Supabase singleton client + typed helper methods.
All DB and Storage operations go through this module.
"""
from __future__ import annotations

import json
import logging
from typing import Any

import httpx
from supabase import create_client, Client

from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

logger = logging.getLogger(__name__)

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client


# ── DB helpers ────────────────────────────────────────────────────────────────

def insert_row(table: str, data: dict) -> dict:
    """Insert a single row and return the inserted record."""
    resp = get_client().table(table).insert(data).execute()
    return resp.data[0] if resp.data else {}


def fetch_rows(table: str, filters: dict | None = None, limit: int = 100) -> list[dict]:
    """Fetch rows from a table with optional equality filters."""
    q = get_client().table(table).select("*")
    for col, val in (filters or {}).items():
        q = q.eq(col, val)
    q = q.limit(limit)
    resp = q.execute()
    return resp.data or []


def upsert_row(table: str, data: dict, on_conflict: str = "id") -> dict:
    """Upsert (insert or update) a single row."""
    resp = get_client().table(table).upsert(data, on_conflict=on_conflict).execute()
    return resp.data[0] if resp.data else {}


def update_row(table: str, row_id: str, data: dict) -> dict:
    """Update a row by its UUID id."""
    resp = get_client().table(table).update(data).eq("id", row_id).execute()
    return resp.data[0] if resp.data else {}


# ── Storage helpers ───────────────────────────────────────────────────────────

def upload_file(bucket: str, path: str, content: bytes, content_type: str = "application/octet-stream") -> str:
    """Upload bytes to Supabase Storage and return the path."""
    get_client().storage.from_(bucket).upload(
        path=path,
        file=content,
        file_options={"content-type": content_type, "upsert": "true"},
    )
    return path


def download_file(bucket: str, path: str) -> bytes:
    """Download a file from Supabase Storage and return raw bytes."""
    resp = get_client().storage.from_(bucket).download(path)
    return resp


# ── Memory helpers ────────────────────────────────────────────────────────────

def memory_set(key: str, value: Any) -> None:
    """Upsert a key/value pair in the memory table (value stored as JSON)."""
    upsert_row("memory", {"key": key, "value": json.dumps(value)}, on_conflict="key")


def memory_get(key: str) -> Any | None:
    """Retrieve a value from the memory table by key."""
    rows = fetch_rows("memory", filters={"key": key}, limit=1)
    if rows:
        return json.loads(rows[0]["value"])
    return None


def memory_get_safe(key: str) -> Any | None:
    """
    Like memory_get but returns None on transport/PostgREST failures so API handlers
    can still return in-process state (e.g. GET /status during a flaky Supabase connection).
    """
    try:
        return memory_get(key)
    except (httpx.RemoteProtocolError, httpx.HTTPError, OSError) as exc:
        logger.warning("memory_get failed for key=%r: %s", key, exc)
        return None
