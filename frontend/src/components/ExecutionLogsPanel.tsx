import type { ExecutionLog } from "@/lib/types";

function statusClass(status: string | undefined) {
  const s = (status || "").toLowerCase();
  if (s === "success") return "text-emerald-200";
  if (s === "failed") return "text-rose-200";
  if (s === "retried") return "text-amber-200";
  if (s === "escalated") return "text-rose-200";
  return "text-slate-300";
}

export default function ExecutionLogsPanel(props: { logs: ExecutionLog[] }) {
  const { logs } = props;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
      <h2 className="text-base font-bold text-sky-200">Execution Logs</h2>
      <p className="text-xs text-slate-400 mt-1">
        Terminal-style audit trail of remediation attempts and retries (simulated execution).
      </p>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3 font-mono text-xs text-slate-200 max-h-72 overflow-auto">
        {logs.length === 0 ? (
          <div className="text-slate-400">No execution logs yet.</div>
        ) : (
          logs
            .slice()
            .sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || ""))
            .map((l) => (
              <div key={l.id} className="mb-3 pb-3 border-b border-slate-800 last:border-b-0 last:mb-0 last:pb-0">
                <div className="text-slate-400">
                  [{new Date(l.timestamp).toLocaleTimeString()}]{" "}
                  <span className={statusClass(l.status)}> {l.status}</span>
                </div>
                <div className="mt-1">{l.action}</div>
                {l.details?.error ? <div className="mt-1 text-rose-200">Error: {l.details.error}</div> : null}
                {l.details?.result ? (
                  <div className="mt-2 text-slate-400 break-words">
                    {JSON.stringify(l.details.result)}
                  </div>
                ) : null}
                {l.details?.recovered_on_attempt ? (
                  <div className="mt-1 text-slate-400">
                    Recovered on attempt #{l.details.recovered_on_attempt}
                  </div>
                ) : null}
              </div>
            ))
        )}
      </div>
    </div>
  );
}

