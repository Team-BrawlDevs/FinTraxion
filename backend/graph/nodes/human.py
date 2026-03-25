"""
human_approval_node — pauses graph execution and waits for human input.

Flow:
  - Saves paused state to Supabase memory under key "run:{run_id}:paused_state"
  - API layer (/approve) injects human_feedback into state and resumes
  - This node reads human_feedback; if not yet set, returns PAUSE sentinel
"""
from __future__ import annotations

import asyncio
from db.supabase_client import memory_set, memory_get
from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "human_approval_node"

# In-process registry: run_id → asyncio.Event
# The FastAPI /approve endpoint signals these events to resume the graph
APPROVAL_EVENTS: dict[str, asyncio.Event] = {}
APPROVAL_DECISIONS: dict[str, str] = {}


def human_approval_node(state: AgentState) -> dict:
    log = get_logger(LOGGER_NAME, state["run_id"])
    run_id = state["run_id"]

    # Check if approval already received (from /approve endpoint)
    feedback = state.get("human_feedback")
    if feedback:
        log.info(f"▶ human_approval_node: feedback received = {feedback!r}")
        approved = [r for r in state["recommendations"]]
        for rec in approved:
            rec["status"] = feedback  # "approved" or "rejected"
        return {
            "approved_actions": approved if feedback == "approved" else [],
            "human_feedback": feedback,
        }

    # First pass — pause and wait
    log.info("▶ human_approval_node: HIGH RISK detected — pausing for human approval")

    # Persist paused state so /approve can resume
    import json
    paused_state = {k: v for k, v in state.items() if k not in ("raw_data",)}
    memory_set(f"run:{run_id}:paused_state", paused_state)
    memory_set(f"run:{run_id}:status", "awaiting_approval")

    # Signal the FastAPI SSE stream that we are paused
    log.info(f"Workflow PAUSED — call POST /approve with run_id={run_id!r} to resume")

    # Return state unchanged with a sentinel so graph edge can detect pause
    return {
        "human_feedback": "__paused__",
        "approved_actions": [],
    }
