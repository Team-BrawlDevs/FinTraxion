import type { AgentEvent, StatusPayload } from "./types";

const DEFAULT_API_BASE = "http://localhost:8000";

function apiBase(): string {
  const raw = (import.meta as any).env?.VITE_API_BASE_URL;
  const value = typeof raw === "string" ? raw : "";
  return (value.trim() ? value.trim() : DEFAULT_API_BASE).replace(/\/+$/, "");
}

export function getApiBase(): string {
  return apiBase();
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function startRun(apiUrl?: string): Promise<{ run_id: string }> {
  const base = (apiUrl || apiBase()).replace(/\/+$/, "");
  const res = await fetch(`${base}/run`, { method: "POST" });
  const txt = await res.text();
  const data = txt ? safeJsonParse(txt) : null;
  if (!res.ok) {
    throw new Error(data?.detail || data?.error || txt || `HTTP ${res.status}`);
  }
  if (!data?.run_id) throw new Error("Missing run_id in /run response");
  return data;
}

export function connectStream(
  runId: string,
  onEvent: (evt: AgentEvent) => void,
  apiUrl?: string,
): EventSource {
  const base = (apiUrl || apiBase()).replace(/\/+$/, "");
  const es = new EventSource(`${base}/stream/${encodeURIComponent(runId)}`);
  es.onmessage = (evt) => {
    const parsed = safeJsonParse(evt.data);
    if (parsed) onEvent(parsed as AgentEvent);
    else onEvent({ event: "parse_error", error: "Invalid SSE JSON", raw: evt.data } as any);
  };
  return es;
}

export async function fetchStatus(runId: string, apiUrl?: string): Promise<StatusPayload> {
  const base = (apiUrl || apiBase()).replace(/\/+$/, "");
  const res = await fetch(`${base}/status?run_id=${encodeURIComponent(runId)}`);
  const txt = await res.text();
  const data = txt ? safeJsonParse(txt) : null;
  if (!res.ok) throw new Error(data?.detail || data?.error || txt || `HTTP ${res.status}`);
  return data as StatusPayload;
}

export async function fetchLogs(runId: string, apiUrl?: string): Promise<any> {
  const base = (apiUrl || apiBase()).replace(/\/+$/, "");
  const res = await fetch(`${base}/logs?run_id=${encodeURIComponent(runId)}&limit=200`);
  const txt = await res.text();
  const data = txt ? safeJsonParse(txt) : null;
  if (!res.ok) throw new Error(data?.detail || data?.error || txt || `HTTP ${res.status}`);
  return data;
}

export async function approveRun(
  runId: string,
  decision: "approved" | "rejected",
  notes: string | null,
  apiUrl?: string,
): Promise<any> {
  const base = (apiUrl || apiBase()).replace(/\/+$/, "");
  const res = await fetch(`${base}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ run_id: runId, decision, notes }),
  });
  const txt = await res.text();
  const data = txt ? safeJsonParse(txt) : null;
  if (!res.ok) throw new Error(data?.detail || data?.error || txt || `HTTP ${res.status}`);
  return data;
}

