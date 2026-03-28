"""
BaselineAgent — captures pre-optimization portfolio cost from the digital twin and persists baseline.
Feeds before/after comparisons for the Quantifiable Impact Engine.
"""
from __future__ import annotations

from datetime import datetime, timezone

from db.supabase_client import memory_set
from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "baseline_agent"


class BaselineAgent:
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ BaselineAgent started")

        twin = state.get("digital_twin") or {}
        metrics = twin.get("metrics") or {}
        before = float(metrics.get("total_monthly_baseline", 0.0) or 0.0)

        baseline_snapshot = {
            "before_cost": round(before, 2),
            "total_active_seats": int(metrics.get("total_active_seats", 0) or 0),
            "service_count": int(metrics.get("service_count", 0) or 0),
            "captured_at": datetime.now(timezone.utc).isoformat(),
            "source": "digital_twin",
            "run_id": state["run_id"],
        }

        run_id = state["run_id"]
        try:
            memory_set(f"run:{run_id}:baseline_snapshot", baseline_snapshot)
        except Exception as exc:
            log.warning(f"Baseline persistence failed: {exc}")

        log.info(f"▶ BaselineAgent complete — before_cost=${before:,.2f}/mo")
        return {"baseline_snapshot": baseline_snapshot}
