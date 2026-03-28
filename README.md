# FinTraxion — Autonomous SaaS Optimization Agent (Enterprise Edition)

This repository contains a production-grade backend and an internal-only dashboard demonstrating an **Enterprise Multi-Agent SaaS Optimization System**. The system autonomously discovers, analyzes, and executes cost-saving infrastructure and licensing changes. 

Built with:
- **FastAPI** (API, SSE streaming, Independent Approvals)
- **LangGraph** (Explicit Multi-Agent orchestration, Shared Context, Governance routing)
- **Supabase** (Persistence, memory snapshots, highly detailed audit trails)
- **FAISS** (Vector similarity search for vendor normalization)
- **Gemini Embeddings & Strong LLMs** (With fallback rules & Graceful Degradation)
- **Pandas** (Data engineering and usage analysis)
- **React + TailwindCSS** (Live dashboard, dynamic cost-analysis graphs)

---

## 🏗 Enterprise Multi-Agent Architecture

The workflow was recently refactored from a linear pipeline into a robust, object-oriented **Multi-Agent Architecture**. 

### The Agents:
1. **`DiscoveryAgent`**: Ingests unstructured financial data (PDFs/CSVs via Supabase Storage).
2. **`NormalizationAgent`**: Uses FAISS embeddings and fuzzy fallbacks to map messy vendor strings into canonical SaaS entities.
3. **`UsageAnalysisAgent`**: Synthesizes mock active-seat data and raw pricing relative to the discovered tools.
4. **`DuplicateDetectionAgent`**: Scans the normalized portfolio for exact duplicates or functional overlapping tools.
5. **`HistoricalMemoryAgent`**: Fetches long-term execution context from past runs to prevent the LLM from making repetitive mistakes.
6. **`DecisionAgent`**: The core LLM engine. It ingests the massive **Shared Context** (usage, duplicates, history) and structure-outputs highly specific optimization recommendations.
7. **`GovernanceAgent`**: Hard-coded deterministic policy layer. It completely decouples risk-evaluation from the LLM, flagging actions as `informational` (low risk) or `require_approval` (medium/high risk).
8. **`HumanApprovalAgent`**: Intercepts the graph flow. Handles independent dictionary-mapped approvals or a global fallback "Approve All" via the UI.
9. **`ExecutionAgent`**: Mocks API actions against third-party tools. Incorporates **Graceful Degradation** — if a primary API attempt fails, it automatically spins up a fallback ticket instead of crashing.
10. **`RecoveryAgent`**: Manages `Tenacity` retry loops for deeper unhandled execution faults.
11. **`MemoryUpdateAgent`**: Finalizes the graph run, computes the final Before/After cost math, and saves FAISS embeddings for new tools.

---

## ✨ Key Features & Capabilities

### 1. **Centralized Shared Context**
Instead of agents just swallowing the explicit output of the previous step, all agents read and write from a massive `AgentState` TypedDict. The `DecisionAgent` aggregates all metrics simultaneously. 

### 2. **Autonomy Branching via Policy Governance**
LLMs are creative, which implies risk. The `GovernanceAgent` runs purely deterministic Python logic on the LLM's output. High-risk actions are hard-routed to a human approval queue. Low-risk actions bypass UI interaction entirely and drop straight down to execution or informational view.

### 3. **Execution Resilience & Fallbacks**
The `ExecutionAgent` implements a heavy `try_execute_primary()` block. When a mocked failure occurs (via the 30% random failure toggle), it instantly catches the exception and routes to a `try_execute_fallback()` (like sending an Admin Email) to ensure the system never catastrophically crashes.

### 4. **Enterprise Audit Trails**
Every step of the way, extremely rich JSON payloads are piped into the Supabase `actions_log`. Every action tracks:
- `agent_name`
- `action_key` (Idempotency Trace ID)
- `decision_reason`
- `risk_level`
- `actual_savings`

### 5. **Robust Duplicate Filtering**
Recommendations are passed through a unique signature generator (`action_type` + `target_service_string`) inside the `DecisionAgent` to guarantee the system never presents redundant recommendations to the operator.

---

## 💻 Frontend (Internal Control Panel)

- **Agent Workflow UI**: Live streaming visualization of exactly which agents are currently active and completing tasks via Server-Sent Events (SSE).
- **Global & Independent Approvals**: Unified Human-in-the-Loop review block capable of accepting operator notes. 
- **Live Cost Impact Analysis**: Animated Tailwind CSS bar charts comparing the exact baseline **Before Optimization** cost against the projected **After Optimization** savings.

---

## ⚙️ Setup Instructions

### 1) Configure Environment Variables
Create a `.env` in the repository root:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `GEMINI_API_KEY`

Optional:
- `GEMINI_MODEL_STRONG` (default `gemini-1.5-flash`)
- `GEMINI_EMBED_MODEL` (default `models/text-embedding-004`)
- `SIMULATE_FAILURES` (default `true` — controls the 30% execution-agent failure rate)

### 2) Bootstrap Database
Run the seeder to prepare your mock CSV and PDF documents in Supabase storage:
`python backend/scripts/seed_supabase.py`

### 3) Start the System
**Backend FastAPI Server:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```
Interactive Swagger UI will be available at: `http://localhost:8000/docs`

**Frontend React/Vite Dashboard:**
```bash
cd frontend
npm install
npm run dev
```
Dashboard will be available at: `http://localhost:5173`

---

## 📡 API Endpoints

### `POST /run`
Instantiates the graph in a background thread and returns a `run_id` for tracking.

### `GET /stream/{run_id}`
Connects to the Server-Sent Event (SSE) stream to listen for `node_complete` and `awaiting_human_approval` events.

### `POST /approve`
Injects independent or global operator decisions back into the stalled LangGraph state.
```json
{
  "run_id": "uuid",
  "decision": "approved",
  "decisions": {
    "Specific Action Item Text": "rejected"
  },
  "notes": "Operator override context"
}
```

### `GET /status?run_id=...`
Polls the Supabase cache for an aggregate view of all historical context, structured recommendations, and execution audit logs.
