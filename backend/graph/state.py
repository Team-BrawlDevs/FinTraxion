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
    digital_twin: dict               # DigitalTwinAgent output
    generated_scenarios: list[dict]  # ScenarioGeneratorAgent output
    simulation_results: list[dict]   # EvaluationAgent output
    recommended_strategy: dict       # StrategyAgent output

    # Enterprise Knowledge Graph & Causality (NetworkX snapshot + shared context)
    knowledge_graph: dict            # Serialized graph (nodes/edges) — see services/knowledge_graph_core
    extracted_entities: list[dict]   # EntityExtractionAgent output
    graph_context: dict              # ContextAgent: root_cause, affected_services, risk_factors, per-rec hints
    graph_alerts: list[dict]         # CausalityAgent: anomalies / cost-spike triggers

    # Decision & Policy
    recommendations: list[dict]      # DecisionAgent output
    governance_flags: list[dict]     # GovernanceAgent output (e.g. require_approval, auto_execute)

    # Execution
    approved_actions: list[dict]     # HumanApprovalAgent output
    execution_logs: list[dict]       # ExecutionAgent & RecoveryAgent output
    execution_results: list[dict]    # Normalized per-action outcomes (predicted vs actual) for Impact Engine
    baseline_snapshot: dict          # BaselineAgent: pre-optimization cost snapshot
    impact_metrics: dict             # Quantifiable Impact Engine aggregate (ROI, efficiency, savings)
    impact_audit: list[dict]         # AuditAgent: trace records for this run
    learning_update: dict            # LearningAgent: feedback signals for future runs

    # Error handling
    errors: list[str]
    retry_count: int                 # tracked by RecoveryAgent

    # Human-in-the-loop
    human_feedback: Optional[str]    # Legacy "approved" | "rejected" | None
    human_feedback_dict: dict[str, str] # map of action string -> "approved" | "rejected"

    # Memory & metadata
    context_memory: dict[str, Any]
    run_id: str                      # UUID per workflow run
