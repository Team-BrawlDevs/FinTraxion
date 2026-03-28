"""
scenario_generator_agent — synthesizes multiple targeted optimization hypotheses.
"""
from __future__ import annotations

import random
from graph.state import AgentState
from services.knowledge_graph_core import dict_to_graph
from utils.logging_utils import get_logger

LOGGER_NAME = "scenario_generator_agent"

class ScenarioGeneratorAgent:
    """
    Agent responsible for translating digital twin intelligence and duplication overlaps
    into actionable what-if matrices (scenarios).
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ ScenarioGeneratorAgent started")

        candidates = state.get("duplicate_candidates", [])
        digital_twin = state.get("digital_twin", {})
        services_map = digital_twin.get("services", {})
        kg = state.get("knowledge_graph") or {}
        G = dict_to_graph(kg)
        
        scenarios = []
        
        # Scenario 1: Aggressive consolidation on top overlaps
        for c in candidates[:3]:
            ctype = c.get("type", "overlap")
            service_a = c.get("service_a")
            service_b = c.get("service_b")
            
            if ctype == "exact_duplicate" and service_b in services_map:
                scenarios.append({
                    "id": f"sc_cancel_{service_b.lower().replace(' ', '_')}",
                    "name": f"Cancel exact duplicate instance of {service_b}",
                    "type": "remove_service",
                    "target": service_b,
                    "confidence_weight": 0.95
                })
            elif service_b in services_map and service_a in services_map:
                scenarios.append({
                    "id": f"sc_consolidate_{service_a}_onto_{service_b}".replace(' ', '_').lower(),
                    "name": f"Consolidate {service_a} onto {service_b}",
                    "type": "remove_service",
                    "target": service_a,
                    "confidence_weight": 0.75
                })

        # Scenario 2: Underutilized license down-scaling (Heuristic)
        underutilized = []
        for name, data in services_map.items():
            if data["utilisation_score"] < 0.6 and data["seats"] > 20:
                underutilized.append(name)
        
        for name in underutilized[:2]:
            down_scale_fraction = random.choice([0.2, 0.3])
            scenarios.append({
                "id": f"sc_scale_down_{name.lower().replace(' ', '_')}",
                "name": f"Reduce {name} license seats by {int(down_scale_fraction*100)}%",
                "type": "reduce_licenses",
                "target": name,
                "value": down_scale_fraction,
                "confidence_weight": 0.85
            })

        # Scenario 3: Aggressive global Tier-downgrade (simulating a global enterprise policy switch)
        scenarios.append({
            "id": "sc_global_tier_downgrade_slack",
            "name": "Downgrade Slack globally to Standard",
            "type": "downgrade_plan",
            "target": "Slack",
            "confidence_weight": 0.50
        })

        # Scenario 4: Graph-informed — services with overlap edges (cascade consolidation)
        for u, v, key, data in G.edges(keys=True, data=True):
            if data.get("relation") != "overlaps_with":
                continue
            la = G.nodes[u].get("label") if u in G else None
            lb = G.nodes[v].get("label") if v in G else None
            if not la or not lb:
                continue
            if la in services_map and lb in services_map:
                scenarios.append({
                    "id": f"sc_kg_overlap_{la}_{lb}".replace(" ", "_").lower()[:48],
                    "name": f"Graph overlap: reduce redundant spend between {la} and {lb}",
                    "type": "remove_service",
                    "target": lb,
                    "confidence_weight": 0.72,
                    "graph_rationale": "overlap_edge",
                })

        # Limit to top 5 scenarios as per enterprise architecture limit to save simulation CPU
        scenarios = scenarios[:5]

        log.info(f"▶ ScenarioGeneratorAgent complete — generated {len(scenarios)} deterministic scenarios.")
        return {"generated_scenarios": scenarios}
