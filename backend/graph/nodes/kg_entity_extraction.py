"""
EntityExtractionAgent — extracts structured entities from SaaS, billing, and usage signals.
Rules for structured rows; optional LLM hook reserved for unstructured blobs.
"""
from __future__ import annotations

from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "kg_entity_extraction"


def _extract_from_usage(usage_data: list[dict]) -> list[dict]:
    out: list[dict] = []
    for u in usage_data:
        name = u.get("canonical_name") or u.get("name") or "Unknown"
        team = u.get("team") or u.get("department") or "Engineering"
        cost = float(u.get("monthly_cost", 0) or 0)
        seats = int(u.get("seat_count", 0) or 0)
        util = float(u.get("utilisation_score", 1.0) or 1.0)
        out.append(
            {
                "type": "service_usage",
                "service": name,
                "team": team,
                "monthly_cost": cost,
                "seat_count": seats,
                "utilisation_score": util,
                "last_used_days_ago": int(u.get("last_used_days_ago", 0) or 0),
                "category": u.get("category", "Other"),
            }
        )
        out.append({"type": "team", "name": team})
        out.append({"type": "cost_line", "service": name, "amount": cost, "unit": "USD/month"})
    return out


def _extract_from_duplicates(dups: list[dict]) -> list[dict]:
    out: list[dict] = []
    for d in dups:
        sa, sb = d.get("service_a"), d.get("service_b")
        if sa:
            out.append({"type": "service", "name": sa})
        if sb:
            out.append({"type": "service", "name": sb})
        out.append(
            {
                "type": "duplicate_pair",
                "service_a": sa,
                "service_b": sb,
                "dup_type": d.get("type", "overlap"),
            }
        )
    return out


def _extract_from_raw(raw: list[dict]) -> list[dict]:
    """Lightweight rules for discovery payloads."""
    out: list[dict] = []
    for row in raw:
        app = row.get("application") or row.get("app") or row.get("name")
        owner = row.get("owner") or row.get("team")
        if app:
            out.append({"type": "service", "name": str(app)})
        if owner:
            out.append({"type": "team", "name": str(owner)})
    return out


class EntityExtractionAgent:
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ EntityExtractionAgent started")

        entities: list[dict] = []
        entities.extend(_extract_from_usage(state.get("usage_data", [])))
        entities.extend(_extract_from_duplicates(state.get("duplicate_candidates", [])))
        entities.extend(_extract_from_raw(state.get("raw_data", [])))

        # De-dup simple dicts (best-effort)
        seen: set[str] = set()
        unique: list[dict] = []
        for e in entities:
            key = str(sorted(e.items()))
            if key not in seen:
                seen.add(key)
                unique.append(e)

        log.info(f"▶ EntityExtractionAgent complete — {len(unique)} entity records")
        return {"extracted_entities": unique}
