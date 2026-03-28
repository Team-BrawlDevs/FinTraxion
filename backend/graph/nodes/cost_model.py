"""
cost_model_agent — evaluates the net mathematical impact of simulated twin permutations.
"""
from __future__ import annotations

from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "cost_model_agent"

class CostModelAgent:
    """
    Agent responsible for ingesting mutant digital twins from the SimulationAgent,
    calculating exact financial deltas, and yielding explicit savings arrays.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ CostModelAgent started")

        baseline_cost = state.get("digital_twin", {}).get("metrics", {}).get("total_monthly_baseline", 0.0)
        simulated_results = state.get("simulation_results", [])
        
        evaluated_scenarios = []

        for sim in simulated_results:
            scenario_meta = sim.get("scenario", {})
            mutated_twin = sim.get("post_mutation_twin", {})
            
            # Recalculate new total
            new_cost = sum(
                float(data.get("price_per_seat", 0.0)) * int(data.get("seats", 0))
                for _, data in mutated_twin.items()
            )
            
            delta_cost = round(baseline_cost - new_cost, 2)
            
            # Reattach the mathematical differential
            evaluated_scenarios.append({
                "scenario": scenario_meta,
                "mutated_twin_baseline_cost": new_cost,
                "predicted_savings": delta_cost,
                "confidence": scenario_meta.get("confidence_weight", 0.50),
            })

            log.info(f"  [Sim {scenario_meta.get('id', '')}]: Before=${baseline_cost:,.2f} / After=${new_cost:,.2f} -> Savings=${delta_cost:,.2f}")

        log.info(f"▶ CostModelAgent complete — priced {len(evaluated_scenarios)} theoretical scenarios.")
        
        # We forward the payload through the shared simulation pipeline
        return {"simulation_results": evaluated_scenarios}
