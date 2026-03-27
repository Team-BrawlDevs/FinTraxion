"""
human_approval_agent — pauses graph execution and waits for human input.

Flow:
  - Scans `governance_flags` for any actions tagged as "require_approval".
  - Saves paused state to Supabase memory under key "run:{run_id}:paused_state".
  - API layer (/approve) injects human_feedback into state and resumes.
  - This node reads human_feedback; if approved, pushes to `approved_actions`.
"""
from __future__ import annotations

import asyncio
from db.supabase_client import memory_set, memory_get
from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "human_approval_agent"

# In-process registry: run_id → asyncio.Event
# The FastAPI /approve endpoint signals these events to resume the graph
APPROVAL_EVENTS: dict[str, asyncio.Event] = {}
APPROVAL_DECISIONS: dict[str, str] = {}


class HumanApprovalAgent:
    """
    Agent responsible for intercepting high-risk or low-confidence actions
    flagged by the GovernanceAgent and pausing for human-in-the-loop intervention.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        run_id = state["run_id"]

        # 1. Filter out what actually needs approval based on governance flags
        recs = state.get("recommendations", [])
        flags = state.get("governance_flags", [])
        
        pending_review = []
        if len(recs) == len(flags):
            for rec, meta in zip(recs, flags):
                if meta.get("flag") == "require_approval":
                    enriched = dict(rec)
                    enriched["_governance_reason"] = meta.get("reason", "Human Review")
                    pending_review.append(enriched)

        if not pending_review:
            # Nothing requires approval, skip pause completely
            log.info("▶ HumanApprovalAgent: No pending actions require human review.")
            return {"human_feedback": "skipped", "approved_actions": []}

        # 2. Check if approval already received (from /approve endpoint resuming graph)
        feedback = state.get("human_feedback")
        
        if feedback and feedback != "__paused__":
            log.info(f"▶ HumanApprovalAgent: global feedback={feedback!r}")
            for rec in pending_review:
                rec["status"] = feedback  # "approved" or "rejected"
                
            return {
                "approved_actions": pending_review if feedback == "approved" else [],
                "human_feedback": feedback,
            }

        # 3. First pass — pause and wait
        log.info(f"▶ HumanApprovalAgent: {len(pending_review)} actions flagged by governance — pausing for human approval")

        # Persist paused state so /approve can resume
        paused_state = {k: v for k, v in state.items() if k not in ("raw_data", "usage_data", "duplicate_candidates")}
        memory_set(f"run:{run_id}:paused_state", paused_state)
        memory_set(f"run:{run_id}:status", "awaiting_approval")

        # Signal the FastAPI SSE stream that we are paused
        log.info(f"Workflow PAUSED — call POST /approve with run_id={run_id!r} to resume")

        # Return state unchanged with a sentinel so graph builder edge can detect pause
        return {
            "human_feedback": "__paused__",
            "approved_actions": [],
        }
