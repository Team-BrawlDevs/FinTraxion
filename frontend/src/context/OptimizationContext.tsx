import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AgentEvent, StatusPayload } from "@/lib/types";
import { approveRun, connectStream, fetchStatus, startRun } from "@/lib/api";

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
  graph_context: {},
  graph_alerts: [],
  baseline_snapshot: {},
  execution_results: [],
};

export type UiRunState = "Idle" | "Running" | "Completed" | "Error";

export type ActivityFeedItem = {
  id: string;
  agent: string;
  action: string;
  time: string;
  status: "active" | "alert" | "monitoring";
};

type OptimizationContextValue = {
  apiBase: string;
  setApiBase: (url: string) => void;
  uiState: UiRunState;
  runId: string;
  lastEvent: AgentEvent | null;
  activeNode: string | null;
  completedNodes: Set<string>;
  status: StatusPayload;
  needsHumanApproval: boolean;
  approvalNotes: string;
  setApprovalNotes: (v: string) => void;
  approveBusy: boolean;
  activityFeed: ActivityFeedItem[];
  resetRun: () => void;
  refreshStatus: (reason?: string, targetRunId?: string) => Promise<void>;
  runAnalysis: () => Promise<void>;
  onApprove: (decision: "approved" | "rejected") => Promise<void>;
};

const OptimizationContext = createContext<OptimizationContextValue | null>(
  null,
);

function formatTimeLabel() {
  const s = Math.floor(Date.now() / 1000) % 60;
  return `${s}s ago`;
}

export function OptimizationProvider({ children }: { children: ReactNode }) {
  const [apiBase, setApiBaseState] = useState<string>(() => {
    if (typeof window === "undefined") return "http://localhost:8000";
    const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
    return (
      (typeof envUrl === "string" && envUrl.trim() ? envUrl.trim() : null) ||
      localStorage.getItem("ft_apiBase") ||
      "http://localhost:8000"
    );
  });

  const [uiState, setUiState] = useState<UiRunState>("Idle");
  const [runId, setRunId] = useState("");
  const [lastEvent, setLastEvent] = useState<AgentEvent | null>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<StatusPayload>(EMPTY_STATUS);
  const [needsHumanApproval, setNeedsHumanApproval] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approveBusy, setApproveBusy] = useState(false);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);

  const sseRef = useRef<EventSource | null>(null);
  const throttleRef = useRef(0);
  const runIdRef = useRef(runId);

  useEffect(() => {
    runIdRef.current = runId;
  }, [runId]);

  const setApiBase = useCallback((url: string) => {
    const normalized = url.replace(/\/+$/, "");
    setApiBaseState(normalized);
    localStorage.setItem("ft_apiBase", normalized);
  }, []);

  useEffect(() => {
    localStorage.setItem("ft_apiBase", apiBase);
  }, [apiBase]);

  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  const safeSetCompleted = useCallback((node: string) => {
    setCompletedNodes((prev) => new Set([...prev, node]));
  }, []);

  const refreshStatus = useCallback(
    async (reason?: string, targetRunId?: string) => {
      const now = Date.now();
      if (now - throttleRef.current < 500 && reason !== "force") return;
      throttleRef.current = now;

      const id = targetRunId || runIdRef.current;
      if (!id) return;
      const s = await fetchStatus(id, apiBase).catch(() => null);
      if (!s) return;
      setStatus(s);

      const paused =
        s.human_feedback === "__paused__" || s.status === "awaiting_approval";
      setNeedsHumanApproval(!!paused);

      if (s.status === "completed") setUiState("Completed");
      if (s.status === "error") setUiState("Error");
    },
    [apiBase],
  );

  const pushFeed = useCallback((evt: AgentEvent) => {
    const node = evt.node ? String(evt.node) : "workflow";
    const label =
      evt.event === "awaiting_human_approval"
        ? "Paused — awaiting human approval"
        : evt.event === "workflow_complete"
          ? "Workflow finished"
          : evt.event === "error"
            ? `Error: ${evt.error || "unknown"}`
            : `Completed ${node}`;

    setActivityFeed((prev) => {
      const item: ActivityFeedItem = {
        id: `${evt.ts || Date.now()}-${node}-${Math.random()}`,
        agent: node.replace(/_/g, " "),
        action: label,
        time: formatTimeLabel(),
        status:
          evt.event === "error"
            ? "alert"
            : evt.event === "awaiting_human_approval"
              ? "monitoring"
              : "active",
      };
      const next = [item, ...prev];
      return next.slice(0, 25);
    });
  }, []);

  const connect = useCallback(
    async (runIdToConnect: string) => {
      if (sseRef.current) sseRef.current.close();
      const es = connectStream(
        runIdToConnect,
        (evt) => {
          setLastEvent(evt);
          pushFeed(evt);

          if (evt.event === "node_complete" && evt.node) {
            const node = String(evt.node);
            setActiveNode(node);
            safeSetCompleted(node);

            if (
              [
                "duplicate_detection",
                "kg_context",
                "baseline",
                "decision",
                "execution",
                "impact_analysis",
                "roi",
                "audit",
                "learning",
                "memory_update",
              ].includes(node)
            ) {
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
    },
    [apiBase, pushFeed, refreshStatus, safeSetCompleted],
  );

  const resetRun = useCallback(() => {
    try {
      if (sseRef.current) sseRef.current.close();
    } catch {
      /* noop */
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
    setActivityFeed([]);
  }, []);

  const runAnalysis = useCallback(async () => {
    setUiState("Running");
    setLastEvent(null);
    setActiveNode(null);
    setCompletedNodes(new Set());
    setNeedsHumanApproval(false);
    setApprovalNotes("");
    setStatus(EMPTY_STATUS);
    setRunId("");
    setActivityFeed([]);

    const data = await startRun(apiBase);
    setRunId(data.run_id);
    runIdRef.current = data.run_id;
    setStatus((prev) => ({ ...prev, run_id: data.run_id, status: "running" }));

    await connect(data.run_id);
    await refreshStatus("force", data.run_id);
  }, [apiBase, connect, refreshStatus]);

  const onApprove = useCallback(
    async (decision: "approved" | "rejected") => {
      const id = runIdRef.current;
      if (!id) return;
      setApproveBusy(true);
      try {
        await approveRun(id, decision, approvalNotes || null, apiBase);
        setNeedsHumanApproval(false);
        await connect(id);
        await refreshStatus("force", id);
      } finally {
        setApproveBusy(false);
      }
    },
    [apiBase, approvalNotes, connect, refreshStatus],
  );

  const value = useMemo<OptimizationContextValue>(
    () => ({
      apiBase,
      setApiBase,
      uiState,
      runId,
      lastEvent,
      activeNode,
      completedNodes,
      status,
      needsHumanApproval,
      approvalNotes,
      setApprovalNotes,
      approveBusy,
      activityFeed,
      resetRun,
      refreshStatus,
      runAnalysis,
      onApprove,
    }),
    [
      apiBase,
      setApiBase,
      uiState,
      runId,
      lastEvent,
      activeNode,
      completedNodes,
      status,
      needsHumanApproval,
      approvalNotes,
      approveBusy,
      activityFeed,
      resetRun,
      refreshStatus,
      runAnalysis,
      onApprove,
    ],
  );

  return (
    <OptimizationContext.Provider value={value}>
      {children}
    </OptimizationContext.Provider>
  );
}

export function useOptimization(): OptimizationContextValue {
  const ctx = useContext(OptimizationContext);
  if (!ctx) {
    throw new Error("useOptimization must be used within OptimizationProvider");
  }
  return ctx;
}
