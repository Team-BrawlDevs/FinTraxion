"""
AuditAgent — durable traceability for impact pipeline: Supabase rows + memory keys.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

from db.supabase_client import insert_row, memory_set
from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "audit_agent"


class AuditAgent:
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ AuditAgent started")

        run_id = state["run_id"]
        im = state.get("impact_metrics") or {}
        audit_records = [
            {
                "ts": datetime.now(timezone.utc).isoformat(),
                "run_id": run_id,
                "step": "impact_metrics",
                "payload": json.loads(json.dumps(im, default=str)),
            },
            {
                "ts": datetime.now(timezone.utc).isoformat(),
                "run_id": run_id,
                "step": "execution_results",
                "payload": state.get("execution_results") or [],
            },
        ]

        try:
            memory_set(f"run:{run_id}:impact_audit", audit_records)
            memory_set(f"run:{run_id}:impact_metrics", im)
        except Exception as exc:
            log.warning(f"Audit memory write failed: {exc}")

        try:
            insert_row("impact_metrics", {
                "run_id": run_id,
                "before_cost": im.get("before_cost"),
                "after_cost": im.get("after_cost"),
                "savings": im.get("savings"),
                "roi": im.get("roi"),
                "efficiency_gain": im.get("efficiency_gain"),
                "payload": im,
            })
        except Exception as exc:
            log.warning(f"impact_metrics table insert skipped (schema or permissions): {exc}")

        try:
            insert_row("impact_audit", {
                "run_id": run_id,
                "step": "summary",
                "payload": {"execution_logs_count": len(state.get("execution_logs") or []), "metrics": im},
            })
        except Exception as exc:
            log.warning(f"impact_audit table insert skipped: {exc}")

        log.info("▶ AuditAgent complete")
        return {"impact_audit": audit_records}
