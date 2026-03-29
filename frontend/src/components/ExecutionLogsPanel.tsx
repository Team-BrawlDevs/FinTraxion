import type { ExecutionLog } from "@/lib/types";

function statusClass(status: string | undefined) {
  const s = (status || "").toLowerCase();
  if (s === "success") return "text-emerald-700 font-semibold";
  if (s === "failed") return "text-danger font-semibold";
  if (s === "retried") return "text-warning font-semibold";
  if (s === "escalated") return "text-danger font-semibold";
  return "text-muted";
}

export default function ExecutionLogsPanel(props: {
  logs: ExecutionLog[];
  executionResults?: Array<Record<string, unknown>>;
}) {
  const { logs, executionResults } = props;

  return (
    <div className="glass-card rounded-md p-5 glass-card-hover">
      <h2 className="font-display text-xl text-ink">Execution logs</h2>
      <p className="text-xs text-muted mt-1">
        Audit trail of remediation attempts and retries (simulated execution).
      </p>

      {executionResults && executionResults.length > 0 ? (
        <div className="mt-4 rounded-md border border-accent/30 bg-accent-light/50 p-3">
          <div className="text-[11px] font-bold text-accent uppercase tracking-wide">
            Predicted vs actual (impact engine)
          </div>
          <div className="mt-2 space-y-2 text-xs text-ink">
            {executionResults.map((r, i) => (
              <div
                key={i}
                className="flex flex-wrap justify-between gap-2 border-b border-edge pb-2 last:border-0 last:pb-0"
              >
                <span className="text-muted truncate max-w-[55%]">
                  {String(r.action ?? "")}
                </span>
                <span className="text-emerald-800 font-mono font-semibold">
                  pred ₹
                  {Math.round(Number(r.predicted_savings ?? 0)).toLocaleString(
                    "en-IN",
                  )}{" "}
                  → act ₹
                  {Math.round(Number(r.actual_savings ?? 0)).toLocaleString(
                    "en-IN",
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-md border border-edge bg-gray-50 p-3 font-mono text-xs text-ink max-h-72 overflow-auto">
        {logs.length === 0 ? (
          <div className="text-muted">No execution logs yet.</div>
        ) : (
          logs
            .slice()
            .sort((a, b) =>
              (a.timestamp || "").localeCompare(b.timestamp || ""),
            )
            .map((l) => (
              <div
                key={l.id}
                className="mb-3 pb-3 border-b border-edge last:border-b-0 last:mb-0 last:pb-0"
              >
                <div className="text-muted">
                  [{new Date(l.timestamp).toLocaleTimeString()}]{" "}
                  <span className={statusClass(l.status)}> {l.status}</span>
                </div>
                <div className="mt-1 text-ink">{l.action}</div>
                {l.details?.error ? (
                  <div className="mt-1 text-danger text-sm">
                    Error: {l.details.error}
                  </div>
                ) : null}
                {l.details?.result ? (
                  <div className="mt-2 text-muted break-words text-[11px]">
                    {JSON.stringify(l.details.result)}
                  </div>
                ) : null}
                {l.details?.recovered_on_attempt ? (
                  <div className="mt-1 text-muted">
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
