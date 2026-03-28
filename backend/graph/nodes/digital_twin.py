"""
digital_twin_agent — builds a structured, immutable model of the SaaS portfolio.
Creates the baseline state for the predictive simulation engine.
"""
from __future__ import annotations

from graph.state import AgentState
from services.knowledge_graph_core import dict_to_graph, summarize_graph
from utils.logging_utils import get_logger

LOGGER_NAME = "digital_twin_agent"

class DigitalTwinAgent:
    """
    Agent responsible for synthesizing raw usage, pricing, and normalization metrics
    into a cohesive, mathematically rigorous 'Digital Twin' of the current infrastructure.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ DigitalTwinAgent started")

        usage_data = state.get("usage_data", [])
        
        # Build the baseline snapshot
        services_map = {}
        total_baseline_cost = 0.0
        total_seats = 0
        
        for u in usage_data:
            name = u.get("canonical_name", "Unknown")
            cost = float(u.get("monthly_cost", 0.0))
            seats = int(u.get("seat_count", 0))
            
            services_map[name] = {
                "category": u.get("category", "Other"),
                "seats": seats,
                "price_per_seat": float(u.get("price_per_seat", 0.0)),
                "monthly_cost": cost,
                "utilisation_score": float(u.get("utilisation_score", 1.0)),
                "last_used_days_ago": int(u.get("last_used_days_ago", 0))
            }
            
            total_baseline_cost += cost
            total_seats += seats

        digital_twin = {
            "services": services_map,
            "metrics": {
                "total_monthly_baseline": total_baseline_cost,
                "total_active_seats": total_seats,
                "service_count": len(services_map)
            }
        }

        # Knowledge graph overlay: dependency / overlap neighborhood for simulation
        kg_payload = state.get("knowledge_graph") or {}
        G = dict_to_graph(kg_payload)
        twin_kg = {
            "summary": summarize_graph(kg_payload),
            "dependency_edges": [],
        }
        for u, v, key, data in G.edges(keys=True, data=True):
            rel = data.get("relation", "")
            if rel in ("depends_on", "overlaps_with"):
                twin_kg["dependency_edges"].append(
                    {
                        "from": G.nodes[u].get("label", u),
                        "to": G.nodes[v].get("label", v),
                        "relation": rel,
                    }
                )
        digital_twin["knowledge_graph"] = twin_kg

        log.info(f"▶ DigitalTwinAgent complete — baseline cost: ${total_baseline_cost:,.2f} across {len(services_map)} services.")
        
        return {"digital_twin": digital_twin}
