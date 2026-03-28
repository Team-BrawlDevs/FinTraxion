"""
ImpactAnalysisAgent — compares simulation-predicted savings vs execution-realized savings;
computes aggregate before/after cost and variance.
"""
from __future__ import annotations

from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "impact_analysis_agent"


def _sum_predicted_from_strategy(state: AgentState) -> float:
    strat = state.get("recommended_strategy") or {}
    if isinstance(strat, dict):
        v = strat.get("predicted_savings")
        if v is not None:
            return float(v)
    return 0.0


def _sum_recommendation_savings(recs: list[dict]) -> float:
    return round(sum(float(r.get("savings", 0) or 0) for r in recs), 2)


class ImpactAnalysisAgent:
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ ImpactAnalysisAgent started")

        baseline = state.get("baseline_snapshot") or {}
        before_cost = float(baseline.get("before_cost", 0.0) or 0.0)
        if before_cost <= 0:
            usage = state.get("usage_data") or []
            before_cost = round(sum(float(u.get("monthly_cost", 0) or 0) for u in usage), 2)

        recs = state.get("recommendations") or []
        predicted_from_strategy = _sum_predicted_from_strategy(state)
        predicted_from_recs = _sum_recommendation_savings(recs)
        predicted_savings = predicted_from_strategy if predicted_from_strategy > 0 else predicted_from_recs

        results = state.get("execution_results") or []
        actual_savings = 0.0
        for r in results:
            if r.get("status") in ("success", "fallback_success", "retried"):
                actual_savings += float(r.get("actual_savings", 0) or 0)

        actual_savings = round(actual_savings, 2)
        after_cost = max(0.0, round(before_cost - actual_savings, 2))
        variance = round(predicted_savings - actual_savings, 2)

        impact_metrics = {
            "before_cost": before_cost,
            "after_cost": after_cost,
            "savings": actual_savings,
            "predicted_savings": predicted_savings,
            "variance_predicted_vs_actual": variance,
            "efficiency_gain": 0.0,
            "roi": 0.0,
            "execution_result_count": len(results),
        }

        cm = dict(state.get("context_memory") or {})
        cm["impact_analysis"] = {
            "predicted_savings": predicted_savings,
            "actual_savings": actual_savings,
            "variance": variance,
        }

        log.info(
            f"▶ ImpactAnalysisAgent complete — before=${before_cost:,.2f} after=${after_cost:,.2f} "
            f"realized=${actual_savings:,.2f} (predicted ${predicted_savings:,.2f})"
        )
        return {"impact_metrics": impact_metrics, "context_memory": cm}
