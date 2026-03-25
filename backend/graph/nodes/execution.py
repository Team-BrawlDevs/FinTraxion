"""
execution_node — executes auto-remediation actions.

Features:
  - Processes approved_actions (or all recommendations if no approval step)
  - Supports typed remediations:
      * scale_down_instance
      * stop_idle_resource
      * reduce_api_rate
      * switch_pricing_tier
      * alert_admin
  - Maintains backward compatibility with text-only recommendations
  - Randomly fails ~30% of the time when SIMULATE_FAILURES=true
  - Logs outcomes to Supabase actions_log
  - Uses time.sleep (not asyncio) — safe to call from a background thread
"""
from __future__ import annotations

import random
import time
import uuid
from datetime import datetime, timezone

from db.supabase_client import insert_row
from graph.state import AgentState
from utils.logging_utils import get_logger
from config import SIMULATE_FAILURES

LOGGER_NAME = "execution_node"


def _simulate_api_call(action: str) -> None:
    """Mock a blocking SaaS API call (safe from any thread)."""
    time.sleep(0.3)  # simulate network I/O
    if SIMULATE_FAILURES and random.random() < 0.30:
        raise RuntimeError(f"Simulated API failure for: {action}")


def _infer_action_type(action: str) -> str:
    """Infer remediation type from a free-text action string."""
    text = action.lower()
    if "scale down" in text or "rightsize" in text:
        return "scale_down_instance"
    if "stop idle" in text or "stop unused" in text:
        return "stop_idle_resource"
    if "api rate" in text or "rate limit" in text:
        return "reduce_api_rate"
    if "switch pricing tier" in text or "downgrade" in text:
        return "switch_pricing_tier"
    if "alert admin" in text or "manual review" in text:
        return "alert_admin"
    # Legacy recommendation patterns used in this project.
    if "cancel duplicate" in text:
        return "switch_pricing_tier"
    if "consolidate overlapping" in text:
        return "alert_admin"
    return "alert_admin"


def _extract_action_spec(rec: dict) -> dict:
    """
    Normalize a recommendation into a structured remediation spec.
    Accepts both structured and legacy action payloads.
    """
    action = rec.get("action", "Unknown action")
    action_type = rec.get("action_type") or _infer_action_type(action)
    target = rec.get("target") or {"service": rec.get("service") or "unknown"}
    params = rec.get("params") or {}
    return {
        "action": action,
        "action_type": action_type,
        "target": target,
        "params": params,
        "savings": rec.get("savings", 0),
    }


def _execute_scale_down(action: str, target: dict, params: dict) -> dict:
    _simulate_api_call(action)
    return {
        "remediation": "scale_down_instance",
        "target": target,
        "new_size": params.get("new_size", "small"),
    }


def _execute_stop_idle(action: str, target: dict, params: dict) -> dict:
    _simulate_api_call(action)
    return {
        "remediation": "stop_idle_resource",
        "target": target,
        "idle_minutes_threshold": params.get("idle_minutes_threshold", 60),
    }


def _execute_reduce_api_rate(action: str, target: dict, params: dict) -> dict:
    _simulate_api_call(action)
    return {
        "remediation": "reduce_api_rate",
        "target": target,
        "new_rate_limit_rpm": params.get("new_rate_limit_rpm", 300),
    }


def _execute_switch_pricing_tier(action: str, target: dict, params: dict) -> dict:
    _simulate_api_call(action)
    return {
        "remediation": "switch_pricing_tier",
        "target": target,
        "target_tier": params.get("target_tier", "lower_tier"),
    }


def _execute_alert_admin(action: str, target: dict, params: dict) -> dict:
    _simulate_api_call(action)
    return {
        "remediation": "alert_admin",
        "target": target,
        "channel": params.get("channel", "email"),
        "message": params.get("message", action),
    }


def _dispatch_remediation(action_spec: dict) -> dict:
    """Dispatch to the correct remediation executor."""
    action = action_spec["action"]
    action_type = action_spec["action_type"]
    target = action_spec["target"]
    params = action_spec["params"]

    dispatch = {
        "scale_down_instance": _execute_scale_down,
        "stop_idle_resource": _execute_stop_idle,
        "reduce_api_rate": _execute_reduce_api_rate,
        "switch_pricing_tier": _execute_switch_pricing_tier,
        "alert_admin": _execute_alert_admin,
    }
    fn = dispatch.get(action_type, _execute_alert_admin)
    return fn(action, target, params)


def _action_key(action: str, savings: float) -> str:
    """Stable identity for one recommendation execution unit."""
    return f"{action}|{round(float(savings or 0.0), 2)}"


def execution_node(state: AgentState) -> dict:
    log = get_logger(LOGGER_NAME, state["run_id"])
    log.info("▶ execution_node started")

    desired_actions = state.get("approved_actions") or state.get("recommendations", [])
    logs: list[dict] = list(state.get("execution_logs", []))
    errors: list[str] = list(state.get("errors", []))

    # Build idempotent action keys from already completed/recovered logs.
    completed_keys: set[str] = set()
    for entry in logs:
        if entry.get("status") in {"success", "retried"}:
            details = entry.get("details") or {}
            key = details.get("action_key")
            if key:
                completed_keys.add(key)

    to_execute: list[dict] = []
    for rec in desired_actions:
        spec = _extract_action_spec(rec)
        action = spec["action"]
        savings = float(spec["savings"] or 0)
        key = _action_key(action, savings)
        if key not in completed_keys:
            rec_with_key = dict(rec)
            rec_with_key["_action_key"] = key
            rec_with_key["_action_spec"] = spec
            to_execute.append(rec_with_key)

    if not to_execute:
        unresolved_failed = any(e.get("status") == "failed" for e in logs)
        outcome = "failure" if unresolved_failed else "success"
        log.info(f"No pending actions to execute (outcome={outcome})")
        return {
            "execution_logs": logs,
            "errors": errors,
            "context_memory": {
                **state.get("context_memory", {}),
                "last_execution_outcome": outcome,
            },
        }

    current_failed = False

    for rec in to_execute:
        spec = rec.get("_action_spec") or _extract_action_spec(rec)
        action = spec["action"]
        action_type = spec["action_type"]
        action_key = rec.get("_action_key", _action_key(action, rec.get("savings", 0)))
        log_entry: dict = {
            "id": str(uuid.uuid4()),
            "run_id": state["run_id"],
            "action": action,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        try:
            remediation_result = _dispatch_remediation(spec)
            log_entry["status"] = "success"
            log_entry["details"] = {
                "savings": rec.get("savings", 0),
                "action_key": action_key,
                "action_type": action_type,
                "result": remediation_result,
            }
            log.info(f"  ✅ Executed [{action_type}]: {action!r}")

        except RuntimeError as exc:
            log_entry["status"] = "failed"
            log_entry["details"] = {"error": str(exc), "action_key": action_key, "action_type": action_type}
            if str(exc) not in errors:
                errors.append(str(exc))
            current_failed = True
            log.error(f"  ❌ Failed [{action_type}]: {action!r} — {exc}")

        # Persist to Supabase
        try:
            insert_row("actions_log", {
                "run_id": log_entry["run_id"],
                "action": log_entry["action"],
                "status": log_entry["status"],
                "details": log_entry.get("details"),
            })
        except Exception as db_exc:
            log.warning(f"DB log write failed: {db_exc}")

        logs.append(log_entry)

    unresolved_failed = any(e.get("status") == "failed" for e in logs)
    outcome = "failure" if unresolved_failed or current_failed else "success"
    log.info(f"▶ execution_node complete — outcome={outcome}")

    return {
        "execution_logs": logs,
        "errors": errors,
        "context_memory": {
            **state.get("context_memory", {}),
            "last_execution_outcome": outcome,
        },
    }
