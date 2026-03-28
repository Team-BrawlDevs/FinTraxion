import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentEvent, DuplicateCandidate, Recommendation, ExecutionLog, StatusPayload } from "@/lib/types";
import { approveRun, connectStream, fetchStatus, startRun } from "@/lib/api";
import { buildMockServices } from "@/lib/mock";
import AgentWorkflow from "@/components/AgentWorkflow";
import DetectedServicesPanel from "@/components/DetectedServicesPanel";
import DuplicateDetectionPanel from "@/components/DuplicateDetectionPanel";
import RecommendationsPanel from "@/components/RecommendationsPanel";
import ExecutionLogsPanel from "@/components/ExecutionLogsPanel";
import ImpactSummary from "@/components/ImpactSummary";
import DigitalTwinPage from "@/components/DigitalTwinPage";

const EMPTY_STATUS: StatusPayload = {
  run_id: "",
  status: "idle",
  last_error: null,
  human_feedback: null,
  retry_count: 0,
  errors: [],
  recommendations: [],
  duplicate_candidates: [],
  execution_logs: [],
  context_memory: {},
};

type UiRunState = "Idle" | "Running" | "Completed" | "Error";
type TabState = "workflow" | "digital_twin";

export default function App() {
  const [uiState, setUiState] = useState<UiRunState>("Idle");
  const [currentTab, setCurrentTab] = useState<TabState>("workflow");
  const [apiBase] = useState<string>(localStorage.getItem("ft_apiBase") || "http://localhost:8000");
  const [runId, setRunId] = useState<string>("");
  const [lastEvent, setLastEvent] = useState<AgentEvent | null>(null);

  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());

  const [status, setStatus] = useState<StatusPayload>(EMPTY_STATUS);
  const [needsHumanApproval, setNeedsHumanApproval] = useState<boolean>(false);
  const [approvalNotes, setApprovalNotes] = useState<string>("");
  const [approveBusy, setApproveBusy] = useState<boolean>(false);

  const sseRef = useRef<EventSource | null>(null);
  const throttleRef = useRef<number>(0);

  useEffect(() => {
    localStorage.setItem("ft_apiBase", apiBase);
  }, [apiBase]);

  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  function resetRun() {
    try {
      if (sseRef.current) sseRef.current.close();
    } catch {
      // no-op
    }
    sseRef.current = null;
    throttleRef.current = 0;

    setUiState("Idle");
    setRunId("");
    setLastEvent(null);
    setActiveNode(null);
    setCompletedNodes(new Set());

    setNeedsHumanApproval(false);
    setApprovalNotes("");
    setApproveBusy(false);

    setStatus(EMPTY_STATUS);
  }

  const duplicateCandidates = (status.duplicate_candidates || []) as DuplicateCandidate[];
  const recommendations = (status.recommendations || []) as Recommendation[];
  const executionLogs = (status.execution_logs || []) as ExecutionLog[];
  const services = useMemo(() => buildMockServices(duplicateCandidates), [duplicateCandidates]);

  function safeSetCompleted(node: string) {
    setCompletedNodes((prev) => {
      const next = new Set(prev);
      next.add(node);
      return next;
    });
  }

  async function refreshStatus(reason?: string, targetRunId?: string) {
    const now = Date.now();
    if (now - throttleRef.current < 500 && reason !== "force") return;
    throttleRef.current = now;

    const id = targetRunId || runId;
    if (!id) return;
    const s = await fetchStatus(id, apiBase).catch(() => null);
    if (!s) return;
    setStatus(s);

    const paused = s.human_feedback === "__paused__" || s.status === "awaiting_approval";
    setNeedsHumanApproval(!!paused);

    if (s.status === "completed") setUiState("Completed");
    if (s.status === "error") setUiState("Error");
  }

  async function connect(runIdToConnect: string) {
    if (sseRef.current) sseRef.current.close();
    const es = connectStream(
      runIdToConnect,
      (evt) => {
        setLastEvent(evt);

        if (evt.event === "node_complete" && evt.node) {
          const node = String(evt.node);
          setActiveNode(node);
          safeSetCompleted(node);

          if (node === "duplicate_detection" || node === "decision" || node === "execution") {
            refreshStatus(node, runIdToConnect).catch(() => {});
          }
        }

        if (evt.event === "awaiting_human_approval") {
          setNeedsHumanApproval(true);
          setUiState("Running");
          if (evt.node) {
            setActiveNode(String(evt.node));
            safeSetCompleted(String(evt.node));
          }
        }

        if (evt.event === "workflow_complete") {
          refreshStatus("force", runIdToConnect).catch(() => {});
        }

        if (evt.event === "error") {
          setUiState("Error");
        }
      },
      apiBase,
    );

    sseRef.current = es;
  }

  async function runAnalysis() {
    setUiState("Running");
    setLastEvent(null);
    setActiveNode(null);
    setCompletedNodes(new Set());
    setNeedsHumanApproval(false);
    setApprovalNotes("");
    setStatus(EMPTY_STATUS);
    setRunId("");

    const data = await startRun(apiBase);
    setRunId(data.run_id);
    setStatus((prev) => ({ ...prev, run_id: data.run_id, status: "running" }));

    await connect(data.run_id);
    // initial pull so UI doesn't stay empty
    await refreshStatus("force", data.run_id);
  }

  async function onApprove(decision: "approved" | "rejected") {
    if (!runId) return;
    setApproveBusy(true);
    try {
      await approveRun(runId, decision, approvalNotes || null, apiBase);
      setNeedsHumanApproval(false);
      // The backend resumes graph via another background thread; reconnect to keep streaming.
      await connect(runId);
      await refreshStatus("force", runId);
    } finally {
      setApproveBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Autonomous Cost Intelligence System</h1>
            <p className="text-xs text-slate-500 mt-2 max-w-2xl">
              This enterprise control panel visualizes discovery, analysis, decision-making, and execution with human-in-the-loop governance.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap items-center justify-end">
            <div
              className={[
                "px-3 py-2 rounded-xl border text-sm font-semibold",
                uiState === "Idle"
                  ? "bg-slate-800/50 border-slate-700 text-slate-200"
                  : uiState === "Running"
                    ? "bg-sky-500/10 border-sky-400/30 text-sky-200"
                    : uiState === "Completed"
                      ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-200"
                      : "bg-rose-500/10 border-rose-400/30 text-rose-200",
              ].join(" ")}
            >
              Status: {uiState}
            </div>

            <button
              onClick={() => runAnalysis()}
              disabled={uiState === "Running"}
              className="rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 font-semibold disabled:opacity-60 shadow-md shadow-sky-500/20"
            >
              Run Analysis
            </button>

            <button
              onClick={() => resetRun()}
              disabled={!runId}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 font-semibold disabled:opacity-60"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-8 mb-6 border-b border-slate-800">
          <div className="flex gap-6 -mb-px px-2">
            <button
              onClick={() => setCurrentTab("workflow")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                currentTab === "workflow"
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              SaaS Optimization Agent
            </button>
            <button
              onClick={() => setCurrentTab("digital_twin")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                currentTab === "digital_twin"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Digital Twin Simulations
              {status.simulation_results && status.simulation_results.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${currentTab === "digital_twin" ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                  {status.simulation_results.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {currentTab === "workflow" ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <AgentWorkflow lastEvent={lastEvent} completedNodes={completedNodes} activeNode={activeNode} />
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <DetectedServicesPanel services={services} />
              <DuplicateDetectionPanel candidates={duplicateCandidates} />
            </div>

            <div className="flex flex-col gap-4">
              <RecommendationsPanel
                recommendations={recommendations}
                needsHumanApproval={needsHumanApproval}
                disabled={approveBusy}
              />

              {needsHumanApproval ? (
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <div className="text-sm font-semibold text-yellow-200">Human approval required</div>
                  <div className="text-xs text-yellow-100 mt-1">Run-level approval affects all recommendations produced in the current graph execution.</div>
                  <label className="block mt-3 text-xs text-slate-200">
                    Operator Notes (optional)
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="mt-2 w-full rounded-xl bg-slate-950 border border-yellow-500/20 p-3 text-sm"
                      placeholder="e.g. Approved for execution during change window"
                    />
                  </label>
                
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => onApprove("approved")}
                      disabled={approveBusy}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30 disabled:opacity-60 px-5 py-2 text-sm font-bold shadow-sm"
                    >
                      Approve All
                    </button>
                    <button
                      onClick={() => onApprove("rejected")}
                      disabled={approveBusy}
                      className="rounded-xl bg-rose-600 hover:bg-rose-500 border border-rose-400/30 disabled:opacity-60 px-5 py-2 text-sm font-bold shadow-sm"
                    >
                      Reject All
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ExecutionLogsPanel logs={executionLogs} />
              <ImpactSummary contextMemory={status.context_memory} />
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <DigitalTwinPage results={status.simulation_results || []} />
          </div>
        )}
      </div>
    </div>
  );
}

