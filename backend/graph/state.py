"""
LangGraph Agent State definition.
Shared across all nodes via TypedDict.
"""
from __future__ import annotations

from typing import Any, Optional
from typing_extensions import TypedDict


class AgentState(TypedDict):
    # Core data pipeline
    raw_data: list[dict]              # discovery_node output
    normalized_services: list[dict]  # normalization_node output
    usage_data: list[dict]           # enrichment_node output
    duplicate_candidates: list[dict] # duplicate_detection_node output
    recommendations: list[dict]      # decision_node output

    # Execution
    approved_actions: list[dict]     # human_approval_node output
    execution_logs: list[dict]       # execution_node output

    # Error handling
    errors: list[str]
    retry_count: int                 # tracked by recovery_node

    # Human-in-the-loop
    human_feedback: Optional[str]   # "approved" | "rejected" | None

    # Memory & metadata
    context_memory: dict[str, Any]
    run_id: str                      # UUID per workflow run
