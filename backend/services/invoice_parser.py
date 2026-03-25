"""
Invoice PDF parser using pdfplumber.
Extracts vendor, amount, date from structured or unstructured PDFs.
"""
from __future__ import annotations

import io
import re
from typing import Optional

import pdfplumber


def parse_invoice(pdf_bytes: bytes) -> dict:
    """
    Extract key fields from a PDF invoice.
    Returns:
      {
        "vendor": str,
        "amount": float | None,
        "date": str | None,
        "raw_text": str,
      }
    """
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        raw_text = "\n".join(page.extract_text() or "" for page in pdf.pages)

    return {
        "vendor": _extract_vendor(raw_text),
        "amount": _extract_amount(raw_text),
        "date": _extract_date(raw_text),
        "raw_text": raw_text[:2000],  # truncate for storage
    }


# ── Private parsers ───────────────────────────────────────────────────────────

def _extract_vendor(text: str) -> str:
    """Heuristic: first non-empty line is usually the company name."""
    for line in text.splitlines():
        line = line.strip()
        if line and len(line) > 2:
            return line
    return "Unknown Vendor"


def _extract_amount(text: str) -> Optional[float]:
    """Find the largest dollar / currency figure in the document."""
    matches = re.findall(r"[\$£€]?\s*([\d,]+\.?\d*)", text)
    amounts = []
    for m in matches:
        try:
            amounts.append(float(m.replace(",", "")))
        except ValueError:
            pass
    return max(amounts) if amounts else None


def _extract_date(text: str) -> Optional[str]:
    """Return first date-like string found (YYYY-MM-DD or MM/DD/YYYY)."""
    pattern = r"\b(\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{2,4})\b"
    m = re.search(pattern, text)
    return m.group(1) if m else None
