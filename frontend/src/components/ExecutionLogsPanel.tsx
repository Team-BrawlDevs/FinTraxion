import type { ExecutionLog } from "@/lib/types";

function statusClass(status: string | undefined) {
  const s = (status || "").toLowerCase();
  if (s === "success") return "text-emerald-600 font-bold shadow-sm";
  if (s === "failed") return "text-rose-600 font-bold shadow-sm";
  if (s === "retried") return "text-amber-600 font-bold shadow-sm";
  if (s === "escalated") return "text-rose-600 font-bold underline decoration-rose-300 underline-offset-4";
  return "text-slate-500";
}

export default function ExecutionLogsPanel(props: {
  logs: ExecutionLog[];
  executionResults?: Array<Record<string, unknown>>;
}) {
  const { logs, executionResults } = props;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-xl flex flex-col h-full min-h-[400px]">
      <div className="pointer-events-none absolute -inset-px rounded-2xl border border-slate-200 opacity-50"></div>
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl mix-blend-multiply"></div>

      <div className="relative z-10 flex-shrink-0">
        <h2 className="text-slate-900 font-display text-2xl font-bold tracking-tight">
          Execution logs
        </h2>
        <p className="text-sm text-slate-600 mt-2 font-medium max-w-sm leading-relaxed">
          Audit trail of remediation attempts and retries (simulated execution).
        </p>
      </div>

      {executionResults && executionResults.length > 0 ? (
        <div className="relative z-10 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            Predicted vs actual (impact engine)
          </div>
          <div className="space-y-2.5 text-xs text-slate-700 font-medium">
            {executionResults.map((r, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/50 pb-2.5 last:border-0 last:pb-0"
              >
                <span className="text-slate-600 truncate max-w-[50%]">
                  {String(r.action ?? "")}
                </span>
                <span className="flex items-center gap-2 px-2.5 py-1 rounded bg-white border border-emerald-200 text-emerald-700 font-mono font-bold tracking-widest shadow-sm">
                  <span className="opacity-60 text-[10px]">PRED</span> ₹{Math.round(Number(r.predicted_savings ?? 0)).toLocaleString("en-IN")}
                  <span className="text-emerald-500/50">→</span>
                  <span className="opacity-60 text-[10px]">ACT</span> ₹{Math.round(Number(r.actual_savings ?? 0)).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mt-6 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-5 font-mono text-[12px] text-slate-700 overflow-auto shadow-inner">
        <div className="sticky top-0 -mt-2 -mx-2 px-2 pb-3 mb-3 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 text-[11px] text-slate-500 flex justify-between uppercase tracking-widest font-bold z-10">
          <span>Terminal Output</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm"></span> SYSTEM.ONLINE</span>
        </div>

        {logs.length === 0 ? (
          <div className="text-slate-500 italic mt-3 animate-pulse">Waiting for execution signals... <span className="text-emerald-500 text-lg">_</span></div>
        ) : (
          <div className="space-y-4 pb-2">
            {logs
              .slice()
              .sort((a, b) =>
                (a.timestamp || "").localeCompare(b.timestamp || ""),
              )
              .map((l) => (
                <div
                  key={l.id}
                  className="pb-4 border-b border-slate-800/80 last:border-b-0 last:mb-0 last:pb-0"
                >
                  <div className="flex items-center gap-2.5 text-slate-500">
                    <span className="text-indigo-600 font-semibold">[{new Date(l.timestamp).toLocaleTimeString("en-US", { hour12: false, fractionalSecondDigits: 3 })}]</span>
                    <span className="text-slate-400 text-xs">▶</span>
                    <span className={statusClass(l.status)}> {l.status?.toUpperCase()}</span>
                  </div>
                  <div className="mt-2 font-bold text-slate-900 tracking-wide text-[13px]">{l.action}</div>
                  
                  {l.details?.error ? (
                    <div className="mt-2 text-rose-700 border-l-2 border-rose-300 pl-2 py-0.5 bg-rose-50 text-[11px] leading-relaxed font-medium">
                      err_trace: {l.details.error}
                    </div>
                  ) : null}
                  
                  {l.details?.result ? (
                    <div className="mt-2 text-slate-600 break-words opacity-80 text-[10px] leading-relaxed">
                      {JSON.stringify(l.details.result)}
                    </div>
                  ) : null}
                  
                  {l.details?.recovered_on_attempt ? (
                    <div className="mt-1.5 font-bold text-amber-600 text-[10px] uppercase tracking-widest flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Recovered @ attempt = {l.details.recovered_on_attempt}
                    </div>
                  ) : null}
                </div>
              ))}
              <div className="text-emerald-500 font-bold animate-pulse inline-block mt-2">_</div>
          </div>
        )}
      </div>
    </div>
  );
}
