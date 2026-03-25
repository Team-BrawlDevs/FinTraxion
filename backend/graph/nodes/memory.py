"""
memory_update_node — persists final decisions, feedback, and context to Supabase memory.
Also updates the FAISS index with vendor embeddings from this run for future use.
"""
from __future__ import annotations

from db.supabase_client import memory_set
from graph.state import AgentState
from services.embeddings import embed_texts
from services.faiss_store import FaissStore
from utils.logging_utils import get_logger

LOGGER_NAME = "memory_update_node"


def _embed(texts: list[str]) -> list[list[float]]:
    return embed_texts(texts, task_type="retrieval_document")


def memory_update_node(state: AgentState) -> dict:
    log = get_logger(LOGGER_NAME, state["run_id"])
    log.info("▶ memory_update_node started")

    run_id = state["run_id"]

    # ── 1. Persist final recommendations + feedback ───────────────────────────
    try:
        memory_set(f"run:{run_id}:recommendations", state.get("recommendations", []))
        memory_set(f"run:{run_id}:human_feedback", state.get("human_feedback"))
        memory_set(f"run:{run_id}:execution_logs", state.get("execution_logs", []))
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
    context_memory = {
        **state.get("context_memory", {}),
        "last_run_id": run_id,
        "total_recommendations": len(state.get("recommendations", [])),
        "total_savings": sum(r.get("savings", 0) for r in state.get("recommendations", [])),
        "approved": state.get("human_feedback") == "approved",
    }

    log.info("▶ memory_update_node complete")
    return {"context_memory": context_memory}
