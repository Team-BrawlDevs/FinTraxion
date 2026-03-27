"""
LangGraph Agent State definition.
Shared across all nodes via TypedDict.
"""
from __future__ import annotations

from typing import Any, Optional
from typing_extensions import TypedDict


class AgentState(TypedDict):
    # Core data pipeline
    raw_data: list[dict]             # DiscoveryAgent output
    normalized_services: list[dict]  # NormalizationAgent output
    usage_data: list[dict]           # UsageAnalysisAgent output
    duplicate_candidates: list[dict] # DuplicateDetectionAgent output
    
    # Shared Context / Advanced Mocks
    historical_context: dict         # HistoricalMemoryAgent output
    simulation_results: list[dict]   # Future expansion
    graph_context: dict              # Future expansion

    # Decision & Policy
    recommendations: list[dict]      # DecisionAgent output
    governance_flags: list[dict]     # GovernanceAgent output (e.g. require_approval, auto_execute)

    # Execution
    approved_actions: list[dict]     # HumanApprovalAgent output
    execution_logs: list[dict]       # ExecutionAgent & RecoveryAgent output

    # Error handling
    errors: list[str]
    retry_count: int                 # tracked by RecoveryAgent

    # Human-in-the-loop
    human_feedback: Optional[str]    # Legacy "approved" | "rejected" | None
    human_feedback_dict: dict[str, str] # map of action string -> "approved" | "rejected"

    # Memory & metadata
    context_memory: dict[str, Any]
    run_id: str                      # UUID per workflow run
