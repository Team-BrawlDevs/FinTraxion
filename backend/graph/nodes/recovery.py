"""
recovery_node — handles execution failures using Tenacity retry with exponential backoff.

If all retries are exhausted, escalates by:
  1. Logging escalation to Supabase actions_log
  2. Setting context_memory["escalated"] = True for the graph to detect
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from tenacity import retry, stop_after_attempt, wait_exponential, before_sleep_log, RetryError
import logging

from db.supabase_client import insert_row
from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "recovery_agent"

MAX_RETRIES = 3


def _attempt_recovery(action: str, attempt: int, log) -> dict:
    """Simulate a recovery attempt (could retry a real API in production)."""
    log.info(f"  Recovery attempt #{attempt} for: {action!r}")
    import random
    # Recovery succeeds with increasing probability on later attempts
    if random.random() < (0.3 * attempt):
        return {"status": "success", "action": action}
    raise RuntimeError(f"Recovery attempt #{attempt} failed for: {action}")


class RecoveryAgent:
    """
    Agent responsible for recovering failed executions.
    Applies exponential backoff retries. If exhausted, escalates via context memory.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ RecoveryAgent started")

        errors = list(state.get("errors", []))
        retry_count = state.get("retry_count", 0) + 1
        context_memory = dict(state.get("context_memory", {}))

        failed_logs = [l for l in state.get("execution_logs", []) if l.get("status") == "failed"]

        if not failed_logs:
            log.info("No failed actions to recover")
            return {"retry_count": retry_count, "context_memory": context_memory}

        recovered_logs: list[dict] = []

        for failed in failed_logs:
            action = failed.get("action", "Unknown")
            failed_details = failed.get("details") or {}
            action_key = failed_details.get("action_key")
            action_type = failed_details.get("action_type")
            prior_result = failed_details.get("result")
            attempt = [0]

            try:
                @retry(
                    stop=stop_after_attempt(MAX_RETRIES),
                    wait=wait_exponential(multiplier=1, min=1, max=4),
                    before_sleep=before_sleep_log(logging.getLogger(LOGGER_NAME), logging.WARNING),
                    reraise=True,
                )
                def do_retry():
                    attempt[0] += 1
                    return _attempt_recovery(action, attempt[0], log)

                result = do_retry()
                log.info(f"  ✅ Recovered: {action!r} on attempt #{attempt[0]}")
                recovered_logs.append({
                    "id": str(uuid.uuid4()),
                    "run_id": state["run_id"],
                    "action": action,
                    "status": "retried",
                    "details": {
                        "agent_name": "RecoveryAgent",
                        "recovered_on_attempt": attempt[0],
                        "action_key": action_key,
                        "action_type": action_type,
                        "result": prior_result or {"remediation": action_type, "recovered": True},
                    },
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

            except (RetryError, RuntimeError) as exc:
                log.error(f"  ❌ All {MAX_RETRIES} recovery attempts exhausted for: {action!r}")
                errors.append(f"Recovery exhausted for: {action}")
                context_memory["escalated"] = True
                context_memory["escalated_action"] = action

                # Persist escalation to Supabase
                try:
                    insert_row("actions_log", {
                        "run_id": state["run_id"],
                        "action": action,
                        "status": "escalated",
                        "details": {"agent_name": "RecoveryAgent", "error": str(exc), "max_retries": MAX_RETRIES},
                    })
                except Exception as db_exc:
                    log.warning(f"Failed to log escalation: {db_exc}")

        # Update execution_logs: replace failed entries with recovered ones
        # and leave unrecoverable entries as is.
        updated_logs = [l for l in state.get("execution_logs", []) if l.get("status") != "failed"]
        updated_logs.extend(recovered_logs)

        log.info(f"▶ RecoveryAgent complete — retry_count={retry_count}, escalated={context_memory.get('escalated', False)}")
        return {
            "execution_logs": updated_logs,
            "errors": errors,
            "retry_count": retry_count,
            "context_memory": context_memory,
        }
