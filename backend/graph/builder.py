"""
LangGraph graph builder — wires all Agent nodes with enterprise conditional routing.

Flow:
  START 
   → discovery 
   → normalization 
   → usage_analysis 
   → duplicate_detection 
   → historical_memory 
   → decision 
   → governance
  
  governance → [any require_approval] → human_approval
  governance → [else]                 → execution
  
  human_approval → [__paused__] → END (wait for /approve)
  human_approval → [approved]   → execution
  
  execution → [success/fallback_success] → memory_update → END
  execution → [total failure]            → recovery → execution  (loop, max 3)
"""
from __future__ import annotations

from langgraph.graph import StateGraph, END

from graph.state import AgentState
from graph.nodes.discovery import DiscoveryAgent
from graph.nodes.normalization import NormalizationAgent
from graph.nodes.usage_analysis import UsageAnalysisAgent
from graph.nodes.detection import DuplicateDetectionAgent
from graph.nodes.historical_memory import HistoricalMemoryAgent
from graph.nodes.decision import DecisionAgent
from graph.nodes.governance import GovernanceAgent
from graph.nodes.human import HumanApprovalAgent
from graph.nodes.execution import ExecutionAgent
from graph.nodes.recovery import RecoveryAgent
from graph.nodes.memory import MemoryUpdateAgent


# ── Conditional edge functions ────────────────────────────────────────────────

def route_after_governance(state: AgentState) -> str:
    """If Governance flagged any action as require_approval → route to human."""
    flags = state.get("governance_flags", [])
    if any(f.get("flag") == "require_approval" for f in flags):
        return "human_approval"
    return "execution"


def route_after_human(state: AgentState) -> str:
    """If still paused (__paused__) → end (API will resume). Else → execution."""
    feedback = state.get("human_feedback", "")
    if feedback == "__paused__":
        return "END"  # Graph suspends; /approve will handle resumption
    return "execution"


def route_after_execution(state: AgentState) -> str:
    """Success → memory_update. Failure → recovery (max 3 retries)."""
    outcome = state.get("context_memory", {}).get("last_execution_outcome", "success")
    retry_count = state.get("retry_count", 0)
    if outcome == "failure" and retry_count < 3:
        return "recovery"
    return "memory_update"


def route_after_recovery(state: AgentState) -> str:
    """After recovery always re-enter execution node."""
    return "execution"


# ── Graph construction ────────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    workflow = StateGraph(AgentState)

    # Register nodes instantiated as explicitly stateless Agent Callable objects
    # Note: the string keys are maintained for backward compatibility with main.py SSE stream tracking.
    workflow.add_node("discovery", DiscoveryAgent())
    workflow.add_node("normalization", NormalizationAgent())
    workflow.add_node("enrichment", UsageAnalysisAgent()) # kept string ID "enrichment" for API compat
    workflow.add_node("duplicate_detection", DuplicateDetectionAgent())
    workflow.add_node("historical_memory", HistoricalMemoryAgent())
    workflow.add_node("decision", DecisionAgent())
    workflow.add_node("governance", GovernanceAgent())
    workflow.add_node("human_approval", HumanApprovalAgent())
    workflow.add_node("execution", ExecutionAgent())
    workflow.add_node("recovery", RecoveryAgent())
    workflow.add_node("memory_update", MemoryUpdateAgent())

    # Linear pipeline edges
    workflow.set_entry_point("discovery")
    workflow.add_edge("discovery", "normalization")
    workflow.add_edge("normalization", "enrichment")
    workflow.add_edge("enrichment", "duplicate_detection")
    workflow.add_edge("duplicate_detection", "historical_memory")
    workflow.add_edge("historical_memory", "decision")
    workflow.add_edge("decision", "governance")

    # Conditional: governance → human_approval OR execution
    workflow.add_conditional_edges(
        "governance",
        route_after_governance,
        {
            "human_approval": "human_approval",
            "execution": "execution",
        },
    )

    # Conditional: human_approval → execution OR END (paused)
    workflow.add_conditional_edges(
        "human_approval",
        route_after_human,
        {
            "execution": "execution",
            "END": END,
        },
    )

    # Conditional: execution → recovery OR memory_update
    workflow.add_conditional_edges(
        "execution",
        route_after_execution,
        {
            "recovery": "recovery",
            "memory_update": "memory_update",
        },
    )

    # Recovery always retries execution
    workflow.add_conditional_edges(
        "recovery",
        route_after_recovery,
        {
            "execution": "execution",
        },
    )

    # Terminal edge
    workflow.add_edge("memory_update", END)

    return workflow.compile()


# Singleton compiled graph
app_graph = build_graph()
