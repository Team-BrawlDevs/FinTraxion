"""
strategy_agent — distills the vast simulation dataset into explicit tactical directives.
"""
from __future__ import annotations

from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "strategy_agent"

class StrategyAgent:
    """
    Agent responsible for isolating the single highest-performing hypothetical
    scenario from the EvaluationAgent and converting it into a structured
    recommendation core for the main Decision LLM to utilize.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ StrategyAgent started")

        results = state.get("simulation_results", [])
        
        # Rank the scores first 
        ranked = sorted(results, key=lambda x: x.get("score", 0), reverse=True)
        
        if not ranked:
            log.warning("▶ StrategyAgent: No viable scenarios were computed. Injecting empty strategy.")
            return {"recommended_strategy": {}}

        best = ranked[0]
        stype = best.get("scenario", {}).get("type", "unknown")
        target = best.get("scenario", {}).get("target", "unknown")
        savings = best.get("predicted_savings", 0.0)
        
        log.info(f"▶ StrategyAgent complete — Strategy selected: {stype} against {target} caching ${savings:,.2f} savings")
        
        return {"recommended_strategy": best}
