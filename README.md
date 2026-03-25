# FinTraxion — Autonomous SaaS Optimization Agent (Enterprise Prototype)

This repository contains a production-grade *prototype* backend and an internal-only dashboard to demonstrate an **Autonomous SaaS Optimization System** built with:
- **FastAPI** (API + SSE streaming)
- **LangGraph** (multi-agent workflow orchestration with state + conditional branching + recovery)
- **Supabase** (persistence + realtime state layer)
- **FAISS** (vector similarity search)
- **Gemini embeddings / LLM** (with model fallback + retries)
- **Pandas** (mock enrichment)
- **pdfplumber** (invoice parsing)
- **Tenacity** (retry/failure handling)

The UI focuses on making the agent behavior visible (workflow steps, recommendations, execution logs, and human-in-the-loop approval).

---

## What’s implemented

### Backend (FastAPI + LangGraph)
1. **Stateful multi-agent workflow** (LangGraph)
2. **Conditional branching**
   - If any recommendation has `risk == "high"` → human approval pause
   - Else → execution runs immediately
3. **Failure recovery loop**
   - `execution` failures → `recovery_node` (Tenacity-based retries) → return to `execution`
4. **Human-in-the-loop**
   - Pause + resume via `POST /approve`
5. **Supabase persistence**
   - `recommendations` (AI outputs / fallback outputs)
   - `actions_log` (execution outcomes)
   - `memory` (run status, paused_state, and context snapshots)
6. **Supabase Storage ingestion**
   - Fetch and parse `transactions.csv` (CSV bank transactions)
   - Fetch and parse `invoice.pdf` (PDF invoice)
7. **FAISS vector similarity**
   - Canonical service embedding index persisted to local files
   - Fuzzy matching fallback if embeddings fail
8. **Strong LLM decision with fallback**
   - `decision_node` uses configured strong Gemini model
   - If the LLM call or JSON parsing fails → deterministic rule-based recommendations are generated and persisted
9. **Auto-remediation execution (simulated)**
   - `execution_node` dispatches by structured `action_type`
   - Uses idempotency keys to avoid re-executing already-successful actions during retries
   - Logs to Supabase `actions_log`

### Frontend (Internal-only dashboard)
1. **SaaS Optimization Agent Dashboard**
   - Workflow panel: `Discovery → Normalization → Detection → Decision → Approval → Execution`
   - Detected services (mocked)
   - Duplicate detection overlaps (visualized)
   - AI recommendations (cards with risk/confidence/savings + explanation)
   - Human approval controls (Approve/Reject are run-level)
   - Execution logs terminal view
   - Impact summary metrics (mocked/heuristic)
2. **SSE integration**
   - Live agent step transitions from `GET /stream/{run_id}`
3. **Operational UX**
   - Agent errors are hidden in the UI
   - **Refresh resets the run** (UI → Idle + closes SSE)

---

## Repository layout (relevant parts)
- `backend/`
  - `main.py` (FastAPI app + endpoints + SSE streaming)
  - `graph/` (LangGraph builder + node implementations)
  - `db/` (Supabase client helpers)
  - `services/` (FAISS store, embeddings, invoice parsing)
  - `static/` (backend-served internal test console at `/`)
- `frontend/`
  - `src/App.tsx` (dashboard)
  - `src/components/*` (dashboard panels)
  - `src/lib/*` (types + API + mocked helpers)

---

## Setup

### 1) Configure environment variables
Create/update `.env` in the repository root. Required variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `GEMINI_API_KEY`

Optional variables used by the implementation:
- `GEMINI_MODEL_FAST` (default `gemini-1.5-flash`)
- `GEMINI_MODEL_STRONG` (default `gemini-1.5-flash`)
- `GEMINI_EMBED_MODEL` (default `models/text-embedding-004`)
- `GEMINI_EMBED_MODEL_FALLBACKS` (comma-separated list, optional)
- `SIMULATE_FAILURES` (default `true`)
- `SUPABASE_BUCKET` (default `saas-files`)
- `FAISS_INDEX_PATH` (default `faiss_index.bin`)
- `FAISS_META_PATH` (default `faiss_meta.json`)
- `FAISS_SIMILARITY_THRESHOLD` (default `0.88`)

### 2) Bootstrap Supabase data
Run the seeder:
- Generates and uploads:
  - `transactions.csv`
  - `invoice.pdf`
- Inserts 5 seed rows into `services`

Seed script:
`backend/scripts/seed_supabase.py`

### 3) Start the backend
Run:
- `uvicorn main:app --reload --port 8000` (from `backend/`)

---

## Backend API (implemented endpoints)

### `POST /run`
Starts a new LangGraph workflow in a background thread.
- Returns: `{ run_id, message, stream_url }`

### `GET /stream/{run_id}`
SSE stream of node transitions and structured status events.
Stream items include:
- `node_complete` events
- `awaiting_human_approval` pause indicator
- `workflow_complete`
- `error`

### `GET /status?run_id=...`
Returns the latest in-memory + Supabase-backed snapshot for a run:
- `errors`
- `recommendations` (persisted)
- `duplicate_candidates`
- `execution_logs`
- `context_memory`

### `POST /approve`
Run-level human approval.
Body:
```json
{
  "run_id": "...",
  "decision": "approved" | "rejected",
  "notes": "optional string"
}
```

### `GET /logs?run_id=...`
Fetches execution log rows from Supabase `actions_log`.

---

## LangGraph workflow (implemented)
Flow:
1. `discovery_node`
2. `normalization_node`
3. `enrichment_node`
4. `duplicate_detection_node`
5. `decision_node`
6. Conditional:
   - If any recommendation is `risk == "high"` → `human_approval_node` (pause)
   - Else → `execution_node`
7. `execution_node`
8. If execution fails → `recovery_node` → back to `execution_node`
9. `memory_update_node` → END

---

## Supabase tables used by the implementation

Minimum expected columns (based on inserts/updates):

### `services`
- `name`
- `category`

Seeded by `backend/scripts/seed_supabase.py`

### `recommendations`
Inserted by `decision_node`:
- `run_id`
- `action`
- `risk`
- `confidence`
- `savings`
- `justification`
- `status` (e.g. `pending`)

### `actions_log`
Inserted by `execution_node` and `recovery_node`:
- `run_id`
- `action`
- `status` (`success`, `failed`, `retried`, `escalated`, etc.)
- `details` (JSON)

### `memory`
Key/value storage used for run state:
- `key`
- `value` (JSON string)

Used by:
- `human_approval_node` (paused_state)
- `/status` (run status snapshots)
- `memory_update_node` (context snapshots)

---

## Embeddings + FAISS behavior (implemented)

### Normalization (`normalization_node`)
1. Attempts to bootstrap/search FAISS index using Gemini embeddings.
2. If embeddings fail:
   - falls back to fuzzy string matching (`thefuzz`)
   - continues without crashing the graph

### Embedding service (`services/embeddings.py`)
- Adds retry behavior (Tenacity)
- Adds model candidate fallback routing:
  - tries the configured `GEMINI_EMBED_MODEL` first
  - then tries `GEMINI_EMBED_MODEL_FALLBACKS` models if the primary model is unavailable

---

## Auto-remediation execution (implemented)

### Recommendation schema (implemented)
`decision_node` produces structured recommendations:
- `action_type`
- `target`
- `params`

### execution dispatch (implemented)
`execution_node` dispatches based on `action_type`:
- `scale_down_instance`
- `stop_idle_resource`
- `reduce_api_rate`
- `switch_pricing_tier`
- `alert_admin`

Notes:
- Current executors simulate calls and failure using `SIMULATE_FAILURES`.
- Execution is **idempotent** using an action key derived from `(action + savings)` and skips already-successful entries during retries.

---

## Frontend (internal dashboard)

### Project
- Located at: `frontend/`
- Built with:
  - React + TypeScript
  - Tailwind CSS (Tailwind v4 + PostCSS config)

### Where it lives
Run:
- `cd frontend`
- `npm run dev`

### What it shows (enterprise control-panel UX)
- Agent workflow step rail with active/completed highlighting
- Detected services (mocked)
- Duplicate overlaps (visualized)
- AI recommendations as cards with visible reasoning
- Human approval requirement (run-level) with Approve/Reject
- Execution logs terminal view
- Impact summary (mocked/heuristic)

### UX behavior changes implemented
- **Agent errors are hidden** in the UI
- **Refresh resets the run** (clears local state and closes SSE)

---

## Troubleshooting (only known behavior from implemented code)

### Embedding model 404 / embedContent unsupported
If your Gemini embedding model is unavailable for your API version:
- `normalization_node` will use fuzzy fallback (graph continues)
- the embeddings service will attempt models in:
  - `GEMINI_EMBED_MODEL`
  - `GEMINI_EMBED_MODEL_FALLBACKS` (if configured)

### LLM model 404
If the strong generation model is unavailable:
- `decision_node` falls back to deterministic rule-based recommendations
- recommendations are still persisted to Supabase

