"""
governance_agent — separated policy logic for autonomy branching.

Reads recommendations from the DecisionAgent. Enforces thresholds for risk and confidence.
Outputs flag metadata for each recommendation to route executions appropriately.
"""
from __future__ import annotations

from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "governance_agent"

class GovernanceAgent:
    """
    Agent responsible for applying deterministic enterprise RBAC and policy logic.
    Decides the immediate fate of a recommendation without LLM intervention.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ GovernanceAgent started")

        recs = state.get("recommendations", [])
        flags = []

        if not recs:
            log.info("▶ GovernanceAgent complete — no recommendations to flag")
            return {"governance_flags": []}

        for i, rec in enumerate(recs):
            confidence = rec.get("confidence", 0.0)
            risk = rec.get("risk", "high").lower()
            
            flag = "require_approval"
            reason = "Default fallback requiring human review."

            if risk == "low":
                flag = "informational"
                reason = "Low risk items are treated as informational recommendations with no automated action."
            elif risk in ["medium", "high"]:
                flag = "require_approval"
                reason = f"Risk factor '{risk}' mandates human approval via policy."
            
            # Map the flag to the recommendation payload implicitly via state list alignment,
            # or by embedding the status directly into the recommendation.
            # We'll output a parallel governance flag list that the graph builder will read.
            flags.append({
                "rec_index": i,
                "action": rec.get("action", "unknown"),
                "flag": flag,
                "reason": reason
            })
            
            # Optionally update the recommendation status in place for downstream UI visibility
            status_map = {
                "require_approval": "pending",
                "auto_execute": "approved",
                "informational": "informational"
            }
            rec["status"] = status_map.get(flag, "pending")
            
            log.info(f"  Flagged: [{flag}] — {rec.get('action')!r} — Reason: {reason}")

        log.info(f"▶ GovernanceAgent complete — flags generated for {len(flags)} actions.")
        return {
            "governance_flags": flags,
            "recommendations": recs  # return mutated list
        }
