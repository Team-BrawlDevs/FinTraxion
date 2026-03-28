"""
LearningAgent — stores outcome signals for cross-run calibration (predicted vs actual variance).
"""
from __future__ import annotations

import json

from db.supabase_client import memory_get, memory_set
from graph.state import AgentState
from utils.logging_utils import get_logger

LOGGER_NAME = "learning_agent"

LEARNING_KEY = "learning:outcomes"
MAX_ENTRIES = 50


class LearningAgent:
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ LearningAgent started")

        run_id = state["run_id"]
        im = state.get("impact_metrics") or {}
        signal = {
            "run_id": run_id,
            "predicted_savings": im.get("predicted_savings"),
            "actual_savings": im.get("savings"),
            "variance": im.get("variance_predicted_vs_actual"),
            "roi": im.get("roi"),
            "efficiency_gain": im.get("efficiency_gain"),
        }

        history: list = []
        try:
            raw = memory_get(LEARNING_KEY)
            if raw is not None:
                if isinstance(raw, str):
                    history = json.loads(raw)
                elif isinstance(raw, list):
                    history = list(raw)
            history.append(signal)
            history = history[-MAX_ENTRIES:]
            memory_set(LEARNING_KEY, history)
        except Exception as exc:
            log.warning(f"Learning memory update failed: {exc}")

        learning_update = {
            "signal": signal,
            "history_size": len(history),
        }

        cm = dict(state.get("context_memory") or {})
        cm["learning_signal"] = signal

        log.info("▶ LearningAgent complete")
        return {"learning_update": learning_update, "context_memory": cm}
