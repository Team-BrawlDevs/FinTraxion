"""
Enterprise Knowledge Graph & Causality Engine.
Subsystem containing 5 agents to map dependencies and perform RCA.
"""
from __future__ import annotations

import json
import networkx as nx

from graph.state import AgentState
from services.llm_router import strong_llm
from utils.logging_utils import get_logger

LOGGER_NAME = "knowledge_graph_agent"

class GraphBuilderAgent:
    """Initializes the NetworkX graph and populates base nodes from normalized_services and usage_data."""
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ GraphBuilderAgent started")
        
        G = nx.DiGraph()
        
        # Add basic service nodes
        for svc in state.get("normalized_services", []):
            name = svc.get("canonical_name", "Unknown")
            G.add_node(name, type="service", category=svc.get("category"))
            
        # Add cost/usage metrics from usage_analysis
        for u in state.get("usage_data", []):
            name = u.get("canonical_name")
            if name and G.has_node(name):
                G.nodes[name]["monthly_cost"] = u.get("monthly_cost", 0)
                G.nodes[name]["seat_count"] = u.get("seat_count", 0)
                G.nodes[name]["utilisation_score"] = u.get("utilisation_score", 1.0)
                
        # Serialize to dict for LangGraph state passing
        kg_data = nx.node_link_data(G)
        log.info(f"GraphBuilder: Created graph with {G.number_of_nodes()} nodes")
        return {"knowledge_graph": kg_data}

class EntityExtractionAgent:
    """Extracts Teams, Users, and implicit entities from the raw footprint."""
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ EntityExtractionAgent started")
        
        G = nx.node_link_graph(state.get("knowledge_graph", {"directed": True, "multigraph": False, "graph": {}, "nodes": [], "links": []}))
        
        # Rule-based extraction (mocking deeper discovery since we don't have real org charts in raw_data)
        # We will map categories to pseudo-teams to demonstrate the Enterprise Graph
        for n, data in G.nodes(data=True):
            if data.get("type") == "service":
                cat = data.get("category", "")
                team_name = "Engineering" if "Developer" in cat else "Sales" if "CRM" in cat else "Operations"
                # Ensure the Team node exists
                if not G.has_node(team_name):
                    G.add_node(team_name, type="team")
                    
        return {"knowledge_graph": nx.node_link_data(G)}

class RelationshipAgent:
    """Creates operational edges (e.g., Team -uses-> Service, Service -overlaps_with-> Service)."""
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ RelationshipAgent started")
        
        G = nx.node_link_graph(state.get("knowledge_graph", {"directed": True, "multigraph": False, "graph": {}, "nodes": [], "links": []}))
        
        # 1. Map Teams using Services
        for n, data in G.nodes(data=True):
            if data.get("type") == "service":
                cat = data.get("category", "")
                team_name = "Engineering" if "Developer" in cat else "Sales" if "CRM" in cat else "Operations"
                G.add_edge(team_name, n, relation="uses")
                G.add_edge(n, f"Cost_{n}", relation="contributes_to", amount=data.get("monthly_cost", 0))

        # 2. Map overlapping edges from DuplicateDetection (if available later, or manually here)
        dupes = state.get("duplicate_candidates", [])
        for d in dupes:
            s1, s2 = d.get("service_a"), d.get("service_b")
            if s1 and s2 and G.has_node(s1) and G.has_node(s2):
                rel_type = "exact_duplicate" if d.get("type") == "exact_duplicate" else "capability_overlap"
                G.add_edge(s1, s2, relation=rel_type)
                
        return {"knowledge_graph": nx.node_link_data(G)}

class CausalityAgent:
    """Traverses the graph to identify Root Causes for cost inefficiencies (using logic or LLM)."""
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ CausalityAgent started")
        
        G = nx.node_link_graph(state.get("knowledge_graph", {"directed": True, "multigraph": False, "graph": {}, "nodes": [], "links": []}))
        
        # Find critical inefficiencies by traversing the graph
        # Example: Low utilization Services that contribute to Cost
        rca_insights = []
        for n, data in G.nodes(data=True):
            if data.get("type") == "service":
                util = data.get("utilisation_score", 1.0)
                cost = data.get("monthly_cost", 0)
                
                if cost > 500 and util < 0.6:
                    teams = [u for u, v, d in G.in_edges(n, data=True) if d.get("relation") == "uses"]
                    team_str = ", ".join(teams) if teams else "Unknown Team"
                    rca_insights.append(f"{n} cost is inefficient (utilization {util*100:.0f}%) because inactive/unassigned users in {team_str} were still billed.")
                    
                # Check for duplications
                out_edges = G.out_edges(n, data=True)
                for u, v, edata in out_edges:
                    if edata.get("relation") == "exact_duplicate":
                        rca_insights.append(f"{u} and {v} are exact duplicates, causing fragmented spend across overlapping vendor contracts.")

        # Save these transient insights into the graph globally
        G.graph["rca_insights"] = rca_insights
        
        return {"knowledge_graph": nx.node_link_data(G)}

class ContextAgent:
    """Packages the Root Cause insights into 'graph_context' so the DecisionAgent can consume them."""
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ ContextAgent started")
        
        G = nx.node_link_graph(state.get("knowledge_graph", {"directed": True, "multigraph": False, "graph": {}, "nodes": [], "links": []}))
        
        insights = G.graph.get("rca_insights", [])
        
        if not insights:
            insights = ["Graph traversal found standard steady-state bounds. No severe anomalies."]
            
        graph_context = {
            "root_cause_analysis": insights,
            "total_nodes": G.number_of_nodes(),
            "total_edges": G.number_of_edges(),
            "risk_factors": ["High fragmentation" if len([e for e in G.edges(data=True) if "duplicate" in e[2].get("relation", "")]) > 2 else "Low fragmentation"]
        }
        
        log.info(f"ContextAgent generated context: {len(insights)} root causes found.")
        return {"graph_context": graph_context}
