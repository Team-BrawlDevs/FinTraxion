"""
simulation_agent — purely functional sandbox for executing what-if states.
"""
from __future__ import annotations

import copy

from graph.state import AgentState
from services.knowledge_graph_core import dict_to_graph
from utils.logging_utils import get_logger

LOGGER_NAME = "simulation_agent"


def _cascade_for_service(G, target_label: str) -> list[str]:
    """One-hop dependents on depends_on edges for scenario cascade modeling."""
    if not target_label or G.number_of_nodes() == 0:
        return []
    nid = None
    for n, d in G.nodes(data=True):
        if d.get("kind") == "service" and d.get("label") == target_label:
            nid = n
            break
    if nid is None:
        return []
    out: list[str] = []
    for _, succ, _k, data in G.out_edges(nid, keys=True, data=True):
        if data.get("relation") == "depends_on":
            lab = G.nodes[succ].get("label", succ)
            if lab not in out:
                out.append(str(lab))
    for pred, _succ, _k, data in G.in_edges(nid, keys=True, data=True):
        if data.get("relation") == "depends_on":
            lab = G.nodes[pred].get("label", pred)
            if lab not in out:
                out.append(str(lab))
    return out[:12]


class SimulationAgent:
    """
    Agent responsible for applying each generated optimization scenario
    against an immutable copy of the Digital Twin.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ SimulationAgent started")

        scenarios = state.get("generated_scenarios", [])
        digital_twin = state.get("digital_twin", {})
        baseline_services = digital_twin.get("services", {})
        G = dict_to_graph(state.get("knowledge_graph") or {})
        
        simulated_results = []
        
        for scenario in scenarios:
            try:
                # 1. Deep copy the baseline twin for isolation
                mutated_twin = copy.deepcopy(baseline_services)
                
                # 2. Extract specific parameters
                stype = scenario.get("type")
                target = scenario.get("target")
                
                if target not in mutated_twin and stype != "remove_service":
                    # skip invalid scenarios unless they are mapping explicit removals where target isn't fully loaded
                    pass
                else:
                    if stype == "remove_service":
                        # Complete deletion of service licensing
                        mutated_twin.pop(target, None)
                        
                    elif stype == "reduce_licenses":
                        # Value contains the percentage fraction to drop
                        val = float(scenario.get("value", 0.0))
                        current_seats = mutated_twin[target]["seats"]
                        mutated_twin[target]["seats"] = max(1, int(current_seats * (1.0 - val)))
                        
                    elif stype == "downgrade_plan":
                        # Arbitrary 40% reduction in price_per_seat mapping
                        current_price = mutated_twin[target]["price_per_seat"]
                        mutated_twin[target]["price_per_seat"] = max(0.0, current_price * 0.6)
                        
                cascade = _cascade_for_service(G, str(target) if target else "")

                # 3. Store the output map against the scenario UUID
                simulated_results.append({
                    "scenario": scenario,
                    "post_mutation_twin": mutated_twin,
                    "cascade_impact": {
                        "dependent_services": cascade,
                        "notes": "Derived from knowledge_graph depends_on / overlap neighborhood.",
                    },
                })
                
            except Exception as e:
                log.warning(f"Failed simulating scenario {scenario.get('id', 'Unknown')}: {e}")
                
        log.info(f"▶ SimulationAgent complete — successfully executed {len(simulated_results)} deterministic simulations.")
        
        # We temporarily pass the payload forward as simulation_results for the cost model
        return {"simulation_results": simulated_results}
