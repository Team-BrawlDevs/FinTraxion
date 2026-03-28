"""
execution_agent — executes auto-remediation actions with resilient fallbacks.

Features:
  - Processes approved_actions OR recommendations flagged by governance as "auto_execute".
  - Graceful degradation: Uses try_execute_primary() and if network/API fails, 
    falls back to try_execute_fallback() (e.g., alert_admin).
  - Enriches the `actions_log` in Supabase with deep trace audit traits.
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

LOGGER_NAME = "execution_agent"


def _simulate_api_call(action: str) -> None:
    """Mock a blocking SaaS API call (safe from any thread)."""
    time.sleep(0.3)  # simulate network I/O
    if SIMULATE_FAILURES and random.random() < 0.30:
        raise RuntimeError(f"Simulated API failure for: {action}")


def _execute_primary(action_type: str, action: str, target: dict, params: dict) -> dict:
    """
    Primary execution branch.
    Throws RuntimeError on failure to trigger fallback.
    """
    _simulate_api_call(action)
    return {
        "execution_path": "primary",
        "action_type": action_type,
        "target": target,
        "params": params,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


def _execute_fallback(action_type: str, action: str, target: dict, params: dict, error: str) -> dict:
    """
    Fallback execution branch when primary fails.
    Usually defaults to generating a manual review ticket or admin alert.
    """
    time.sleep(0.1)  # mock internal alert gen time
    return {
        "execution_path": "fallback",
        "action_type": "alert_admin",
        "target": target,
        "params": {
            "channel": "slack_alerts",
            "message": f"Fallback alert: Automated action '{action_type}' failed due to: {error}. Manual intervention required."
        },
        "original_error": error,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


def _action_key(action: str, savings: float) -> str:
    """Stable identity for one recommendation execution unit."""
    return f"{action}|{round(float(savings or 0.0), 2)}"


class ExecutionAgent:
    """
    Agent responsible for applying system changes based on the approved recommendations
    or the governance 'auto_execute' flags. 
    Implements deep resilience and auditability.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ ExecutionAgent started")

        # Gather what needs to be executed
        to_execute = []
        
        # 1. From Human Approval
        if "approved_actions" in state and state["approved_actions"]:
            to_execute.extend(state["approved_actions"])
            
        # 2. From Governance Auto-Execute
        recs = state.get("recommendations", [])
        flags = state.get("governance_flags", [])
        
        # If lengths match, we zip them and pick out "auto_execute"
        if len(recs) == len(flags):
            for rec, meta in zip(recs, flags):
                if meta.get("flag") == "auto_execute" and rec not in to_execute:
                    # Provide metadata trace context for the execution logs
                    enriched_rec = dict(rec)
                    enriched_rec["_governance_reason"] = meta.get("reason", "Unknown")
                    to_execute.append(enriched_rec)
        else:
            # Fallback if governance flags aren't populated for some reason: execute all approved by human
            log.warning("Governance flags size mismatch or missing. Only executing explicitly approved actions.")

        logs: list[dict] = list(state.get("execution_logs", []))
        errors: list[str] = list(state.get("errors", []))

        # Build idempotent action keys from already completed/recovered logs.
        completed_keys: set[str] = set()
        for entry in logs:
            if entry.get("status") in {"success", "retried", "fallback_success"}:
                details = entry.get("details") or {}
                key = details.get("action_key")
                if key:
                    completed_keys.add(key)

        filtered_to_execute: list[dict] = []
        for rec in to_execute:
            action = rec.get("action", "Unknown")
            savings = float(rec.get("savings", 0))
            key = _action_key(action, savings)
            if key not in completed_keys:
                rec["_action_key"] = key
                filtered_to_execute.append(rec)

        if not filtered_to_execute:
            unresolved_failed = any(e.get("status") == "failed" for e in logs)
            outcome = "failure" if unresolved_failed else "success"
            log.info(f"No pending actions to execute (outcome={outcome})")
            return {
                "execution_logs": logs,
                "execution_results": list(state.get("execution_results", [])),
                "errors": errors,
                "context_memory": {
                    **state.get("context_memory", {}),
                    "last_execution_outcome": outcome,
                },
            }

        current_failed = False
        execution_results: list[dict] = list(state.get("execution_results", []))

        for rec in filtered_to_execute:
            action = rec.get("action", "Unknown")
            action_type = rec.get("action_type", "alert_admin")
            target = rec.get("target", {})
            params = rec.get("params", {})
            action_key = rec.get("_action_key")
            savings = rec.get("savings", 0.0)

            log_entry: dict = {
                "id": str(uuid.uuid4()),
                "run_id": state["run_id"],
                "action": action,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            try:
                # Primary Execution Attempt
                result = _execute_primary(action_type, action, target, params)
                log_entry["status"] = "success"
                log_entry["details"] = {
                    "agent_name": "ExecutionAgent",
                    "decision_reason": rec.get("_governance_reason", "Human Approved"),
                    "risk_level": rec.get("risk", "Medium"),
                    "actual_savings": savings,
                    "action_key": action_key,
                    "action_type": action_type,
                    "result": result,
                }
                log.info(f"  ✅ Executed Primary [{action_type}]: {action!r}")

            except RuntimeError as exc:
                log.warning(f"  ⚠️ Primary Execution Failed [{action_type}]: {action!r} — {exc}. Attempting fallback...")
                try:
                    # Fallback Execution Attempt
                    fallback_result = _execute_fallback(action_type, action, target, params, str(exc))
                    log_entry["status"] = "fallback_success"
                    log_entry["details"] = {
                        "agent_name": "ExecutionAgent",
                        "decision_reason": rec.get("_governance_reason", "Human Approved") + " (Fallback invoked)",
                        "risk_level": rec.get("risk", "Medium"),
                        "actual_savings": 0.0,  # Fallback usually means no immediate savings
                        "action_key": action_key,
                        "action_type": "alert_admin",
                        "result": fallback_result,
                    }
                    log.info(f"  ✅ Executed Fallback [alert_admin] for {action!r}")
                except Exception as fallback_exc:
                    # Total Execution Failure
                    log_entry["status"] = "failed"
                    log_entry["details"] = {
                        "agent_name": "ExecutionAgent",
                        "error": str(fallback_exc), 
                        "action_key": action_key, 
                        "action_type": action_type
                    }
                    if str(fallback_exc) not in errors:
                        errors.append(str(fallback_exc))
                    current_failed = True
                    log.error(f"  ❌ Total Execution Failure for {action!r} — {fallback_exc}")

            # Persist robust audit trace to Supabase
            try:
                insert_row("actions_log", {
                    "run_id": log_entry["run_id"],
                    "action": log_entry["action"],
                    "status": log_entry["status"],
                    "details": log_entry.get("details", {}),
                })
            except Exception as db_exc:
                log.warning(f"DB log write failed: {db_exc}")

            logs.append(log_entry)

            pred = float(rec.get("savings", 0) or 0)
            actual = float((log_entry.get("details") or {}).get("actual_savings", 0) or 0)
            execution_results.append(
                {
                    "action": action,
                    "action_key": action_key,
                    "predicted_savings": pred,
                    "actual_savings": actual,
                    "status": log_entry.get("status"),
                    "variance_vs_predicted": round(pred - actual, 2),
                }
            )

        unresolved_failed = any(e.get("status") == "failed" for e in logs)
        outcome = "failure" if unresolved_failed or current_failed else "success"
        log.info(f"▶ ExecutionAgent complete — outcome={outcome}")

        return {
            "execution_logs": logs,
            "execution_results": execution_results,
            "errors": errors,
            "context_memory": {
                **state.get("context_memory", {}),
                "last_execution_outcome": outcome,
            },
        }
