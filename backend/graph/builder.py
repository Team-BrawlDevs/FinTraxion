"""
LangGraph graph builder — wires all Agent nodes with enterprise conditional routing.

Flow:
  START 
   → discovery 
   → normalization 
   → usage_analysis 
   → duplicate_detection 
  → historical_memory 
  → kg_entity_extraction → kg_graph_builder → kg_relationship → kg_causality → kg_context
  → decision 
   → governance
  
  governance → [any require_approval] → human_approval
  governance → [else]                 → execution
  
  human_approval → [__paused__] → END (wait for /approve)
  human_approval → [approved]   → execution
  
  execution → [failure & retries left] → recovery → execution
  execution → [else] → impact_analysis → roi → audit → learning → memory_update → END
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
from graph.nodes.digital_twin import DigitalTwinAgent
from graph.nodes.scenario_generator import ScenarioGeneratorAgent
from graph.nodes.simulation import SimulationAgent
from graph.nodes.cost_model import CostModelAgent
from graph.nodes.evaluation import EvaluationAgent
from graph.nodes.strategy import StrategyAgent
from graph.nodes.kg_entity_extraction import EntityExtractionAgent
from graph.nodes.kg_graph_builder import GraphBuilderAgent
from graph.nodes.kg_relationship import RelationshipAgent
from graph.nodes.kg_causality import CausalityAgent
from graph.nodes.kg_context import ContextAgent
from graph.nodes.baseline_agent import BaselineAgent
from graph.nodes.impact_analysis import ImpactAnalysisAgent
from graph.nodes.roi_agent import ROIAgent
from graph.nodes.audit_agent import AuditAgent
from graph.nodes.learning_agent import LearningAgent

# ── Conditional edge functions ────────────────────────────────────────────────

def route_after_governance(state: AgentState) -> str:
    """If Governance flagged any action as require_approval → route to human. Auto_execute routes directly to execution."""
    flags = state.get("governance_flags", [])
    
    # If anything specifically requires approval, we must pause for the human
    if any(f.get("flag") == "require_approval" for f in flags):
        return "human_approval"
        
    # If things are informational or auto_execute, they bypass the human flow
    return "execution"


def route_after_human(state: AgentState) -> str:
    """If still paused (__paused__) → end (API will resume). Else → execution."""
    feedback = state.get("human_feedback", "")
    if feedback == "__paused__":
        return "END"  # Graph suspends; /approve will handle resumption
    return "execution"


def route_after_execution(state: AgentState) -> str:
    """Failure → recovery (max 3 retries). Else → Quantifiable Impact Engine → memory_update."""
    outcome = state.get("context_memory", {}).get("last_execution_outcome", "success")
    retry_count = state.get("retry_count", 0)
    if outcome == "failure" and retry_count < 3:
        return "recovery"
    return "impact_analysis"


def route_after_recovery(state: AgentState) -> str:
    """After recovery always re-enter execution node."""
    return "execution"


# ── Graph construction ────────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    workflow = StateGraph(AgentState)

    # Register nodes instantiated as explicitly stateless Agent Callable objects
    workflow.add_node("discovery", DiscoveryAgent())
    workflow.add_node("normalization", NormalizationAgent())
    workflow.add_node("enrichment", UsageAnalysisAgent()) # kept string ID "enrichment" for API compat
    workflow.add_node("duplicate_detection", DuplicateDetectionAgent())
    workflow.add_node("historical_memory", HistoricalMemoryAgent())

    # Enterprise Knowledge Graph & Causality (NetworkX)
    workflow.add_node("kg_entity_extraction", EntityExtractionAgent())
    workflow.add_node("kg_graph_builder", GraphBuilderAgent())
    workflow.add_node("kg_relationship", RelationshipAgent())
    workflow.add_node("kg_causality", CausalityAgent())
    workflow.add_node("kg_context", ContextAgent())
    
    # NEW Digital Twin Engine Subsystem
    workflow.add_node("digital_twin", DigitalTwinAgent())
    workflow.add_node("scenario_generator", ScenarioGeneratorAgent())
    workflow.add_node("simulation", SimulationAgent())
    workflow.add_node("cost_model", CostModelAgent())
    workflow.add_node("evaluation", EvaluationAgent())
    workflow.add_node("strategy", StrategyAgent())
    
    workflow.add_node("decision", DecisionAgent())
    workflow.add_node("governance", GovernanceAgent())
    workflow.add_node("human_approval", HumanApprovalAgent())
    workflow.add_node("execution", ExecutionAgent())
    workflow.add_node("recovery", RecoveryAgent())
    workflow.add_node("baseline", BaselineAgent())
    workflow.add_node("impact_analysis", ImpactAnalysisAgent())
    workflow.add_node("roi", ROIAgent())
    workflow.add_node("audit", AuditAgent())
    workflow.add_node("learning", LearningAgent())
    workflow.add_node("memory_update", MemoryUpdateAgent())

    # Linear pipeline edges
    workflow.set_entry_point("discovery")
    workflow.add_edge("discovery", "normalization")
    workflow.add_edge("normalization", "enrichment")
    workflow.add_edge("enrichment", "duplicate_detection")
    workflow.add_edge("duplicate_detection", "historical_memory")

    workflow.add_edge("historical_memory", "kg_entity_extraction")
    workflow.add_edge("kg_entity_extraction", "kg_graph_builder")
    workflow.add_edge("kg_graph_builder", "kg_relationship")
    workflow.add_edge("kg_relationship", "kg_causality")
    workflow.add_edge("kg_causality", "kg_context")
    
    # Wire the simulation subsystem inline (uses knowledge_graph from state)
    workflow.add_edge("kg_context", "digital_twin")
    workflow.add_edge("digital_twin", "baseline")
    workflow.add_edge("baseline", "scenario_generator")
    workflow.add_edge("scenario_generator", "simulation")
    workflow.add_edge("simulation", "cost_model")
    workflow.add_edge("cost_model", "evaluation")
    workflow.add_edge("evaluation", "strategy")
    workflow.add_edge("strategy", "decision")
    
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

    # Conditional: execution → recovery OR impact pipeline
    workflow.add_conditional_edges(
        "execution",
        route_after_execution,
        {
            "recovery": "recovery",
            "impact_analysis": "impact_analysis",
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

    workflow.add_edge("impact_analysis", "roi")
    workflow.add_edge("roi", "audit")
    workflow.add_edge("audit", "learning")
    workflow.add_edge("learning", "memory_update")

    # Terminal edge
    workflow.add_edge("memory_update", END)

    return workflow.compile()


# Singleton compiled graph
app_graph = build_graph()
