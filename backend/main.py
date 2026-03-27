"""
FastAPI application — Autonomous SaaS Optimization System.

Endpoints:
  POST /run           → Start workflow, returns run_id immediately (Swagger-friendly)
  GET  /stream/{id}   → SSE log stream for a running workflow
  GET  /status        → Returns current state for a run_id
  POST /approve       → Inject human approval/rejection; resume paused graph
  GET  /logs          → Fetch actions_log from Supabase
  GET  /health        → Health check
"""
from __future__ import annotations

import asyncio
import json
import threading
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path

from db.supabase_client import fetch_rows, memory_set, memory_get
from graph.builder import app_graph
from graph.state import AgentState
from utils.logging_utils import get_logger

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Autonomous SaaS Optimization System",
    description="Multi-agent LangGraph backend: discovery → normalization → enrichment → "
                "duplicate detection → LLM decision → human approval → execution → recovery → memory.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# In-memory state registry
_run_states: dict[str, AgentState] = {}
_run_log_queues: dict[str, asyncio.Queue] = {}  # run_id → asyncio.Queue
_main_loop: asyncio.AbstractEventLoop | None = None  # set on startup

log = get_logger("api", "system")


@app.on_event("startup")
async def _capture_loop():
    global _main_loop
    _main_loop = asyncio.get_running_loop()


# ── Models ────────────────────────────────────────────────────────────────────

class RunResponse(BaseModel):
    run_id: str
    message: str
    stream_url: str


class ApproveRequest(BaseModel):
    run_id: str
    decision: str   # Legacy: "approved" | "rejected"
    decisions: Optional[dict[str, str]] = None  # map of action string -> "approved" | "rejected"
    notes: Optional[str] = None


class ApproveResponse(BaseModel):
    run_id: str
    status: str
    message: str


# ── Background runner ─────────────────────────────────────────────────────────

def _push(run_id: str, item: dict | None):
    """Thread-safe: push a log item onto the run's asyncio Queue."""
    queue = _run_log_queues.get(run_id)
    if queue and _main_loop:
        asyncio.run_coroutine_threadsafe(queue.put(item), _main_loop)


def _run_graph_thread(run_id: str, initial_state: AgentState):
    """Execute the LangGraph workflow in a background thread."""
    try:
        for event in app_graph.stream(initial_state, stream_mode="updates"):
            for node_name, node_output in event.items():
                # Update cached state
                if run_id in _run_states:
                    _run_states[run_id].update(node_output or {})

                log_entry = {
                    "ts": datetime.now(timezone.utc).isoformat(),
                    "run_id": run_id,
                    "node": node_name,
                    "event": "node_complete",
                    "output_keys": list((node_output or {}).keys()),
                }

                # Detect human-approval pause
                feedback = _run_states[run_id].get("human_feedback", "")
                if feedback == "__paused__":
                    log_entry["event"] = "awaiting_human_approval"
                    log_entry["message"] = f"PAUSED — POST /approve with run_id={run_id}"

                _push(run_id, log_entry)

        _push(run_id, {"run_id": run_id, "event": "workflow_complete",
                       "ts": datetime.now(timezone.utc).isoformat()})
        memory_set(f"run:{run_id}:status", "completed")

    except Exception as exc:
        import traceback
        error_detail = traceback.format_exc()
        _push(run_id, {"run_id": run_id, "event": "error", "error": str(exc),
                       "traceback": error_detail,
                       "ts": datetime.now(timezone.utc).isoformat()})
        # Store the error in the cached state for /status visibility
        if run_id in _run_states:
            _run_states[run_id]["errors"] = [f"Graph crashed: {exc}\n{error_detail}"]
        memory_set(f"run:{run_id}:status", "error")
        memory_set(f"run:{run_id}:last_error", str(exc))
    finally:
        _push(run_id, None)  # sentinel — closes the SSE stream


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def frontend():
    """Serve a lightweight frontend test console."""
    return FileResponse(STATIC_DIR / "index.html")


@app.post("/run", response_model=RunResponse, summary="Start a new optimization workflow")
async def run_workflow():
    """
    Starts the multi-agent workflow and returns a run_id immediately.
    Connect to GET /stream/{run_id} to receive live SSE log events.
    """
    run_id = str(uuid.uuid4())

    initial_state: AgentState = {
        "raw_data": [],
        "normalized_services": [],
        "usage_data": [],
        "duplicate_candidates": [],
        "recommendations": [],
        "approved_actions": [],
        "execution_logs": [],
        "errors": [],
        "human_feedback": None,
        "human_feedback_dict": {},
        "context_memory": {},
        "run_id": run_id,
        "retry_count": 0,
    }

    _run_states[run_id] = initial_state
    _run_log_queues[run_id] = asyncio.Queue()
    memory_set(f"run:{run_id}:status", "running")

    thread = threading.Thread(
        target=_run_graph_thread,
        args=(run_id, initial_state),
        daemon=True,
    )
    thread.start()

    return RunResponse(
        run_id=run_id,
        message="Workflow started. Connect to stream_url to follow live logs.",
        stream_url=f"http://localhost:8000/stream/{run_id}",
    )


@app.get("/stream/{run_id}", summary="SSE log stream for a running workflow")
async def stream_logs(run_id: str):
    """
    Server-Sent Events stream — open in browser or via curl.
    Emits a JSON event per node transition until workflow completes.

    curl example:
      curl -N http://localhost:8000/stream/{run_id}
    """
    if run_id not in _run_log_queues:
        raise HTTPException(status_code=404, detail=f"run_id {run_id!r} not found")

    queue = _run_log_queues[run_id]

    async def event_generator():
        while True:
            try:
                item = await asyncio.wait_for(queue.get(), timeout=180)
            except asyncio.TimeoutError:
                yield "data: {\"event\": \"timeout\"}\n\n"
                break
            if item is None:
                yield "data: {\"event\": \"done\"}\n\n"
                break
            yield f"data: {json.dumps(item)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/status", summary="Get current workflow state")
async def get_status(run_id: str = Query(..., description="run_id from POST /run")):
    """Returns the latest state snapshot for a given run."""
    if run_id not in _run_states:
        status = memory_get(f"run:{run_id}:status")
        if status is None:
            raise HTTPException(status_code=404, detail=f"run_id {run_id!r} not found")
        return {"run_id": run_id, "status": status, "source": "supabase_memory"}

    state = _run_states[run_id]
    status = memory_get(f"run:{run_id}:status") or "running"
    last_error = memory_get(f"run:{run_id}:last_error")
    return {
        "run_id": run_id,
        "status": status,
        "last_error": last_error,  # surfaced for easy debugging
        "human_feedback": state.get("human_feedback"),
        "retry_count": state.get("retry_count", 0),
        "errors": state.get("errors", []),
        "recommendations": state.get("recommendations", []),
        "duplicate_candidates": state.get("duplicate_candidates", []),
        "execution_logs": state.get("execution_logs", []),
        "context_memory": state.get("context_memory", {}),
    }


@app.post("/approve", response_model=ApproveResponse, summary="Submit human approval/rejection")
async def approve_workflow(body: ApproveRequest):
    """
    Injects human feedback into a paused workflow and resumes execution.
    decision must be "approved" or "rejected".
    """
    if body.decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="decision must be 'approved' or 'rejected'")

    paused_state = memory_get(f"run:{body.run_id}:paused_state")
    if paused_state is None and body.run_id not in _run_states:
        raise HTTPException(
            status_code=404,
            detail=f"No paused workflow found for run_id={body.run_id!r}. "
                   "Ensure the workflow was paused by human_approval_node first."
        )

    state_to_resume: AgentState = paused_state or _run_states[body.run_id]
    state_to_resume["human_feedback"] = body.decision
    if body.decisions:
        state_to_resume["human_feedback_dict"] = body.decisions
    state_to_resume["context_memory"]["approval_notes"] = body.notes or ""
    _run_states[body.run_id] = state_to_resume

    # Ensure a queue exists for streaming resume
    if body.run_id not in _run_log_queues:
        _run_log_queues[body.run_id] = asyncio.Queue()

    memory_set(f"run:{body.run_id}:status", "resuming")

    def resume_thread():
        try:
            for event in app_graph.stream(state_to_resume, stream_mode="updates"):
                for node_name, node_output in event.items():
                    _run_states[body.run_id].update(node_output or {})
                    _push(body.run_id, {
                        "ts": datetime.now(timezone.utc).isoformat(),
                        "run_id": body.run_id,
                        "node": node_name,
                        "event": "node_complete",
                        "output_keys": list((node_output or {}).keys()),
                    })
            memory_set(f"run:{body.run_id}:status", "completed")
            _push(body.run_id, {"run_id": body.run_id, "event": "workflow_complete",
                                "ts": datetime.now(timezone.utc).isoformat()})
        except Exception as exc:
            log.error(f"Resume failed for {body.run_id}: {exc}")
            memory_set(f"run:{body.run_id}:status", "error")
        finally:
            _push(body.run_id, None)

    threading.Thread(target=resume_thread, daemon=True).start()

    return ApproveResponse(
        run_id=body.run_id,
        status="resuming",
        message=f"Workflow resumed with decision={body.decision!r}. "
                f"Reconnect to /stream/{body.run_id} for live updates.",
    )


@app.get("/logs", summary="Fetch action logs from Supabase")
async def get_logs(
    limit: int = Query(50, ge=1, le=200),
    run_id: Optional[str] = Query(None),
):
    """Returns execution logs from Supabase actions_log table."""
    filters = {"run_id": run_id} if run_id else None
    rows = fetch_rows("actions_log", filters=filters, limit=limit)
    return {"count": len(rows), "logs": rows}


@app.get("/health", summary="Health check")
async def health():
    return {"status": "ok", "ts": datetime.now(timezone.utc).isoformat()}
