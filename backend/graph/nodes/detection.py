"""
duplicate_detection_node — detects exact duplicates and functional overlaps.

Strategies:
  1. Exact deduplication on canonical_name
  2. FAISS cosine similarity (threshold 0.88) for functional overlaps
  3. Hardcoded SaaS capability map cross-reference
"""
from __future__ import annotations

from config import FAISS_SIMILARITY_THRESHOLD
from graph.state import AgentState
from services.embeddings import embed_texts
from services.faiss_store import FaissStore
from utils.logging_utils import get_logger

LOGGER_NAME = "duplicate_detection_agent"

# Known functional overlaps (category-level)
CAPABILITY_MAP: dict[str, list[str]] = {
    "Communication": ["Slack", "Microsoft Teams", "Zoom", "Google Meet", "Loom"],
    "Project Management": ["Jira", "Asana", "Monday.com", "Linear"],
    "Productivity": ["Notion", "Confluence", "Google Workspace", "Microsoft 365"],
    "Developer Tools": ["GitHub", "GitLab"],
    "CRM": ["Salesforce", "HubSpot"],
    "Support": ["Intercom", "Zendesk"],
    "Infrastructure": ["AWS", "GCP", "Azure"],
    "Observability": ["Datadog", "PagerDuty"],
    "Storage": ["Dropbox", "Box"],
    "Design": ["Figma", "Miro"],
}


def _embed(texts: list[str]) -> list[list[float]]:
    return embed_texts(texts, task_type="retrieval_document")


class DuplicateDetectionAgent:
    """
    Agent responsible for detecting exact duplicates, 
    semantic functional overlaps via FAISS, 
    and hardcoded SaaS capability map crossings.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ DuplicateDetectionAgent started")

        usage_data = state["usage_data"]
        candidates: list[dict] = []

        # ── 1. Exact duplicates ───────────────────────────────────────────────────
        seen: dict[str, dict] = {}
        for svc in usage_data:
            name = svc.get("canonical_name", "")
            if name in seen:
                candidates.append({
                    "type": "exact_duplicate",
                    "service_a": seen[name]["canonical_name"],
                    "service_b": name,
                    "monthly_cost_a": seen[name].get("monthly_cost", 0),
                    "monthly_cost_b": svc.get("monthly_cost", 0),
                    "recommendation": f"Remove duplicate entry for {name}",
                })
                log.info(f"  Exact duplicate: {name!r}")
            else:
                seen[name] = svc

        # ── 2. Functional overlap via FAISS ───────────────────────────────────────
        unique_names = list(seen.keys())
        if len(unique_names) > 1:
            try:
                embeddings = _embed(unique_names)
                overlap_store = FaissStore()
                overlap_store.add(unique_names, embeddings)

                checked: set[tuple] = set()
                for i, name in enumerate(unique_names):
                    results = overlap_store.search(embeddings[i], top_k=3)
                    for match_name, similarity in results:
                        if match_name == name:
                            continue
                        key = tuple(sorted([name, match_name]))
                        if key in checked:
                            continue
                        checked.add(key)
                        if similarity >= FAISS_SIMILARITY_THRESHOLD:
                            candidates.append({
                                "type": "functional_overlap_faiss",
                                "service_a": name,
                                "service_b": match_name,
                                "similarity": round(similarity, 3),
                                "recommendation": f"Consider consolidating {name} and {match_name}",
                            })
                            log.info(f"  FAISS overlap: {name!r} ↔ {match_name!r} [{similarity:.2f}]")
            except Exception as exc:
                log.warning(f"FAISS overlap detection failed: {exc}")

        # ── 3. Capability map overlap ─────────────────────────────────────────────
        capability_checked: set[tuple] = set()
        for category, members in CAPABILITY_MAP.items():
            present = [n for n in unique_names if n in members]
            if len(present) >= 2:
                for i in range(len(present)):
                    for j in range(i + 1, len(present)):
                        key = tuple(sorted([present[i], present[j]]))
                        if key not in capability_checked:
                            capability_checked.add(key)
                            if not any(
                                c for c in candidates
                                if {c.get("service_a"), c.get("service_b")} == {present[i], present[j]}
                            ):
                                svc_a = seen.get(present[i], {})
                                svc_b = seen.get(present[j], {})
                                candidates.append({
                                    "type": "capability_overlap",
                                    "category": category,
                                    "service_a": present[i],
                                    "service_b": present[j],
                                    "monthly_cost_a": svc_a.get("monthly_cost", 0),
                                    "monthly_cost_b": svc_b.get("monthly_cost", 0),
                                    "recommendation": f"Both {present[i]} and {present[j]} serve {category} — consider consolidation",
                                })
                                log.info(f"  Capability overlap [{category}]: {present[i]!r} ↔ {present[j]!r}")

        log.info(f"▶ DuplicateDetectionAgent complete — {len(candidates)} candidates found")
        return {"duplicate_candidates": candidates}
