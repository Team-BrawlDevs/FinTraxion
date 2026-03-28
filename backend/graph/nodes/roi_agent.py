"""
ROIAgent — derives ROI and efficiency_gain from impact_metrics + baseline.
Uses a lightweight implementation-cost heuristic so ROI is finite without external finance data.
"""
from __future__ import annotations

from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "roi_agent"


class ROIAgent:
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ ROIAgent started")

        im = dict(state.get("impact_metrics") or {})
        before = float(im.get("before_cost", 0) or 0)
        after = float(im.get("after_cost", 0) or 0)
        savings = float(im.get("savings", 0) or 0)

        if before > 0:
            efficiency_gain = round((before - after) / before * 100.0, 4)
        else:
            efficiency_gain = 0.0

        # One-time change cost heuristic (FinOps program + engineering time), capped
        impl_cost = min(max(5000.0, 0.03 * max(before, 1.0) * 12.0), 250_000.0)
        annual_savings = savings * 12.0
        roi = round(annual_savings / max(impl_cost, 1.0), 4)

        im["efficiency_gain"] = efficiency_gain
        im["roi"] = roi
        im["annualized_savings"] = round(annual_savings, 2)
        im["implementation_cost_estimate"] = round(impl_cost, 2)

        cm = dict(state.get("context_memory") or {})
        cm["roi_snapshot"] = {
            "roi": im["roi"],
            "efficiency_gain_pct": efficiency_gain,
            "annualized_savings": im["annualized_savings"],
        }

        log.info(f"▶ ROIAgent complete — ROI={roi:.2f}x annual vs est. implementation, efficiency={efficiency_gain:.2f}%")
        return {"impact_metrics": im, "context_memory": cm}
