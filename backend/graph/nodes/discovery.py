"""
discovery_node — fetches CSV + PDF from Supabase Storage,
parses them, simulates email ingestion, and populates state["raw_data"].

Partial failures are handled gracefully: each source is tried independently.
"""
from __future__ import annotations

import io
import logging

import pandas as pd

from db.supabase_client import download_file
from graph.state import AgentState
from services.invoice_parser import parse_invoice
from utils.logging_utils import get_logger
from config import SUPABASE_BUCKET

LOGGER_NAME = "discovery_agent"


class DiscoveryAgent:
    """
    Agent responsible for autonomous data gathering. 
    Connects to external systems (simulated via Supabase Storage) to ingest PDF invoices, CSV logs, etc.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ DiscoveryAgent started")

        raw_data: list[dict] = []
        errors: list[str] = list(state.get("errors", []))

        # ── 1. CSV (bank transactions) ────────────────────────────────────────────
        try:
            csv_bytes = download_file(SUPABASE_BUCKET, "transactions.csv")
            df = pd.read_csv(io.BytesIO(csv_bytes))
            for _, row in df.iterrows():
                raw_data.append({
                    "source": "csv",
                    "vendor": str(row.get("vendor", row.get("description", "Unknown"))),
                    "amount": float(row.get("amount", 0.0)),
                    "date": str(row.get("date", "")),
                    "currency": str(row.get("currency", "USD")),
                })
            log.info(f"CSV parsed: {len(df)} transactions")
        except Exception as exc:
            msg = f"DiscoveryAgent: CSV fetch/parse failed — {exc}"
            log.warning(msg)
            errors.append(msg)

        # ── 2. PDF (invoice) ──────────────────────────────────────────────────────
        try:
            pdf_bytes = download_file(SUPABASE_BUCKET, "invoice.pdf")
            invoice = parse_invoice(pdf_bytes)
            raw_data.append({
                "source": "pdf_invoice",
                "vendor": invoice["vendor"],
                "amount": invoice["amount"] or 0.0,
                "date": invoice["date"] or "",
                "currency": "USD",
                "raw_text": invoice["raw_text"],
            })
            log.info(f"PDF invoice parsed: vendor={invoice['vendor']}, amount={invoice['amount']}")
        except Exception as exc:
            msg = f"DiscoveryAgent: PDF fetch/parse failed — {exc}"
            log.warning(msg)
            errors.append(msg)

        # ── 3. Simulated email ingestion ──────────────────────────────────────────
        email_records = [
            {"source": "email", "vendor": "Notion", "amount": 16.0, "date": "2025-03-01", "currency": "USD"},
            {"source": "email", "vendor": "Loom", "amount": 12.5, "date": "2025-03-05", "currency": "USD"},
            {"source": "email", "vendor": "Linear", "amount": 18.0, "date": "2025-03-10", "currency": "USD"},
        ]
        raw_data.extend(email_records)
        log.info(f"Email simulation: {len(email_records)} records injected")

        log.info(f"▶ DiscoveryAgent complete — {len(raw_data)} raw records gathered")
        return {
            "raw_data": raw_data,
            "errors": errors,
        }
