"""
LangGraph graph builder — wires all 9 agent nodes with conditional routing.

Flow:
  START → discovery → normalization → enrichment → duplicate_detection → decision
  decision → [risk=="high"] → human_approval → execution
  decision → [else]         → execution
  execution → [success]     → memory_update → END
  execution → [failure]     → recovery → execution  (loop, max 3)
"""
from __future__ import annotations

from langgraph.graph import StateGraph, END

from graph.state import AgentState
from graph.nodes.discovery import discovery_node
from graph.nodes.normalization import normalization_node
from graph.nodes.enrichment import enrichment_node
from graph.nodes.detection import duplicate_detection_node
from graph.nodes.decision import decision_node
from graph.nodes.human import human_approval_node
from graph.nodes.execution import execution_node
from graph.nodes.recovery import recovery_node
from graph.nodes.memory import memory_update_node


# ── Conditional edge functions ────────────────────────────────────────────────

def route_after_decision(state: AgentState) -> str:
    """If any recommendation is high-risk → human approval, else → execute."""
    recommendations = state.get("recommendations", [])
    if any(r.get("risk") == "high" for r in recommendations):
        return "human_approval"
    return "execution"


def route_after_human(state: AgentState) -> str:
    """If still paused (__paused__) → end (API will resume). Else → execution."""
    feedback = state.get("human_feedback", "")
    if feedback == "__paused__":
        return "END"  # Graph suspends; /approve will re-invoke
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

    # Register nodes
    workflow.add_node("discovery", discovery_node)
    workflow.add_node("normalization", normalization_node)
    workflow.add_node("enrichment", enrichment_node)
    workflow.add_node("duplicate_detection", duplicate_detection_node)
    workflow.add_node("decision", decision_node)
    workflow.add_node("human_approval", human_approval_node)
    workflow.add_node("execution", execution_node)
    workflow.add_node("recovery", recovery_node)
    workflow.add_node("memory_update", memory_update_node)

    # Linear pipeline edges
    workflow.set_entry_point("discovery")
    workflow.add_edge("discovery", "normalization")
    workflow.add_edge("normalization", "enrichment")
    workflow.add_edge("enrichment", "duplicate_detection")
    workflow.add_edge("duplicate_detection", "decision")

    # Conditional: decision → human_approval OR execution
    workflow.add_conditional_edges(
        "decision",
        route_after_decision,
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
