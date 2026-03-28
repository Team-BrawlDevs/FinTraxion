"""
simulation_agent — purely functional sandbox for executing what-if states.
"""
from __future__ import annotations

import copy
from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "simulation_agent"

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
                        
                # 3. Store the output map against the scenario UUID
                simulated_results.append({
                    "scenario": scenario,
                    "post_mutation_twin": mutated_twin
                })
                
            except Exception as e:
                log.warning(f"Failed simulating scenario {scenario.get('id', 'Unknown')}: {e}")
                
        log.info(f"▶ SimulationAgent complete — successfully executed {len(simulated_results)} deterministic simulations.")
        
        # We temporarily pass the payload forward as simulation_results for the cost model
        return {"simulation_results": simulated_results}
