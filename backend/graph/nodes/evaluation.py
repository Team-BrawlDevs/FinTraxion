"""
evaluation_agent — assesses financial and risk feasibility of simulated scenarios.
Logs hypothetical trials to Supabase for historical intelligence querying.
"""
from __future__ import annotations

import json
from db.supabase_client import insert_row
from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "evaluation_agent"

class EvaluationAgent:
    """
    Agent responsible for ingesting priced theoretical models, ranking them
    using a multi-variate score (savings * confidence), and publishing the results
    into explicit Supabase audit trails.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ EvaluationAgent started")

        run_id = state["run_id"]
        results = state.get("simulation_results", [])
        
        evaluated_scenarios = []

        for sim in results:
            scenario = sim.get("scenario", {})
            savings = float(sim.get("predicted_savings", 0.0))
            confidence = float(sim.get("confidence", 0.50))
            mutated_twin_baseline_cost = float(sim.get("mutated_twin_baseline_cost", 0.0))
            original_baseline_cost = round(mutated_twin_baseline_cost + savings, 2)
            
            # Simple heuristic score factoring both savings and execution feasibility
            raw_score = savings * confidence
            
            evaluated_scenarios.append({
                "scenario": scenario,
                "predicted_savings": savings,
                "confidence": confidence,
                "score": round(max(0.0, raw_score), 2),
                "mutated_twin_baseline_cost": mutated_twin_baseline_cost,
                "original_baseline_cost": original_baseline_cost
            })

        # Rank the highest scores first
        ranked_scenarios = sorted(evaluated_scenarios, key=lambda x: x["score"], reverse=True)
        
        if ranked_scenarios:
            ranked_scenarios[0]["selected"] = True
            log.info(f"▶ Top strategy identified: {ranked_scenarios[0]['scenario'].get('id')} — Score: {ranked_scenarios[0]['score']}")
        
        for i, outcome in enumerate(ranked_scenarios):
            is_selected = (i == 0)
            
            try:
                insert_row("simulation_logs", {
                    "run_id": run_id,
                    "scenario": json.dumps(outcome["scenario"]),
                    "predicted_savings": outcome["predicted_savings"],
                    "confidence": outcome["confidence"],
                    "selected": is_selected
                })
            except Exception as e:
                log.warning(f"Failed to log simulation outcome: {e}")

        log.info(f"▶ EvaluationAgent complete — evaluated and published {len(ranked_scenarios)} futures.")
        
        # We replace the payload with the fully vetted metrics
        return {"simulation_results": ranked_scenarios}
