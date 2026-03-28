"""
memory_update_agent — persists final decisions, feedback, and context to Supabase memory.
Also updates the FAISS index with vendor embeddings from this run for future use.
"""
from __future__ import annotations

from db.supabase_client import memory_set
from graph.state import AgentState
from services.embeddings import embed_texts
from services.faiss_store import FaissStore
from utils.logging_utils import get_logger

LOGGER_NAME = "memory_update_agent"


def _embed(texts: list[str]) -> list[list[float]]:
    return embed_texts(texts, task_type="retrieval_document")


class MemoryUpdateAgent:
    """
    Agent responsible for persisting execution logs, feedback, and FAISS indexing
    at the end of a graph run. It maintains long-term state across sessions.
    """
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ MemoryUpdateAgent started")

        run_id = state["run_id"]

        # ── 1. Persist final recommendations + feedback ───────────────────────────
        try:
            memory_set(f"run:{run_id}:recommendations", state.get("recommendations", []))
            memory_set(f"run:{run_id}:human_feedback", state.get("human_feedback"))
            memory_set(f"run:{run_id}:execution_logs", state.get("execution_logs", []))
            memory_set(f"run:{run_id}:impact_metrics", state.get("impact_metrics", {}))
            memory_set(f"run:{run_id}:execution_results", state.get("execution_results", []))
            memory_set(f"run:{run_id}:baseline_snapshot", state.get("baseline_snapshot", {}))
            memory_set(f"run:{run_id}:status", "completed")
            log.info("  Persisted run summary to Supabase memory")
        except Exception as exc:
            log.warning(f"  Memory persistence failed: {exc}")

        # ── 2. Update FAISS index ─────────────────────────────────────────────────
        try:
            canonical_names = list({
                s.get("canonical_name")
                for s in state.get("normalized_services", [])
                if s.get("canonical_name")
            })

            if canonical_names:
                store = FaissStore.load()
                # Only embed new names not already indexed
                existing = set(store.metadata)
                new_names = [n for n in canonical_names if n not in existing]

                if new_names:
                    embeddings = _embed(new_names)
                    if not isinstance(embeddings[0], list):
                        embeddings = [embeddings]
                    store.add(new_names, embeddings)
                    store.save()
                    log.info(f"  FAISS updated with {len(new_names)} new vendor embeddings")
                else:
                    log.info("  No new vendors to add to FAISS index")
        except Exception as exc:
            log.warning(f"  FAISS update failed: {exc}")

        # ── 3. Update context_memory snapshot ────────────────────────────────────
        im = state.get("impact_metrics") or {}
        if im.get("before_cost") is not None:
            total_cost_before = float(im.get("before_cost", 0) or 0)
            total_cost_after = float(im.get("after_cost", 0) or 0)
            total_savings = float(im.get("savings", 0) or 0)
        else:
            total_savings = sum(r.get("savings", 0) for r in state.get("recommendations", []))
            total_cost_before = sum(u.get("monthly_cost", 0) for u in state.get("usage_data", []))
            total_cost_after = max(0.0, total_cost_before - total_savings)

        context_memory = {
            **state.get("context_memory", {}),
            "last_run_id": run_id,
            "total_recommendations": len(state.get("recommendations", [])),
            "total_savings": round(total_savings, 2),
            "total_cost_before": round(total_cost_before, 2),
            "total_cost_after": round(total_cost_after, 2),
            "impact_metrics": im,
            "approved": state.get("human_feedback") == "approved",
            "last_execution_outcome": state.get("context_memory", {}).get("last_execution_outcome", "success")
        }

        log.info("▶ MemoryUpdateAgent complete")
        return {"context_memory": context_memory}

