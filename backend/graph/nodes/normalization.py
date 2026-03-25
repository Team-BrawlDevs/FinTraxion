"""
normalization_node — maps raw vendor names to canonical service names.

Strategy:
  1. Embed each vendor name with configured embedding model
  2. Search FAISS index of known canonical names
  3. Fuzzy-match fallback when FAISS confidence < threshold
"""
from __future__ import annotations

from thefuzz import process as fuzz_process

from config import FAISS_SIMILARITY_THRESHOLD
from graph.state import AgentState
from services.embeddings import embed_texts
from services.faiss_store import FaissStore
from utils.logging_utils import get_logger

LOGGER_NAME = "normalization_node"

# Canonical SaaS names the system knows about
CANONICAL_SERVICES = [
    "Slack", "Microsoft Teams", "Zoom", "Google Meet", "Notion",
    "Confluence", "Jira", "Asana", "Monday.com", "Linear",
    "GitHub", "GitLab", "Figma", "Miro", "Loom",
    "Salesforce", "HubSpot", "Intercom", "Zendesk", "Stripe",
    "AWS", "GCP", "Azure", "Datadog", "PagerDuty",
    "Dropbox", "Box", "Google Workspace", "Microsoft 365",
]

def _embed(texts: list[str]) -> list[list[float]]:
    """Embed a list of strings."""
    return embed_texts(texts, task_type="retrieval_document")


def normalization_node(state: AgentState) -> dict:
    log = get_logger(LOGGER_NAME, state["run_id"])
    log.info("▶ normalization_node started")

    errors = list(state.get("errors", []))
    faiss_enabled = True

    # Build FAISS index from canonical names on first use.
    # If embedding is unavailable, continue with fuzzy fallback only.
    store = FaissStore.load()
    if store.size == 0:
        try:
            log.info("Building FAISS index from canonical services list")
            canonical_embeddings = _embed(CANONICAL_SERVICES)
            store.add(CANONICAL_SERVICES, canonical_embeddings)
            store.save()
        except Exception as exc:
            faiss_enabled = False
            err = f"Normalization FAISS bootstrap failed; using fuzzy fallback: {exc}"
            errors.append(err)
            log.warning(err)

    normalized: list[dict] = []

    for record in state["raw_data"]:
        vendor = record.get("vendor", "Unknown")
        try:
            results = []
            if faiss_enabled and store.size > 0:
                query_emb = _embed([vendor])
                if query_emb:
                    results = store.search(query_emb[0], top_k=1)

            if results and results[0][1] >= FAISS_SIMILARITY_THRESHOLD:
                canonical = results[0][0]
                method = "faiss"
                confidence = results[0][1]
            else:
                # Fuzzy fallback
                match, score = fuzz_process.extractOne(vendor, CANONICAL_SERVICES)
                canonical = match if score >= 75 else vendor
                method = "fuzzy" if score >= 75 else "raw"
                confidence = score / 100.0

            normalized.append({
                **record,
                "canonical_name": canonical,
                "normalization_method": method,
                "normalization_confidence": round(confidence, 3),
            })
            log.info(f"  {vendor!r} → {canonical!r} [{method}, conf={confidence:.2f}]")

        except Exception as exc:
            log.warning(f"  Failed to normalize {vendor!r}: {exc}")
            normalized.append({**record, "canonical_name": vendor, "normalization_method": "error", "normalization_confidence": 0.0})

    log.info(f"▶ normalization_node complete — {len(normalized)} records")
    return {"normalized_services": normalized, "errors": errors}
