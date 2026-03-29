import type { ReactNode } from "react";
import type { GraphContextPayload, Recommendation } from "@/lib/types";

function Section(props: { title: string; children: ReactNode; type?: "alert" | "context" }) {
  const isAlert = props.type === "alert";
  return (
    <div className={`rounded-xl border p-5 shadow-sm transition-all duration-300 relative overflow-hidden group/section ${
      isAlert 
        ? "bg-rose-50/80 border-rose-200 hover:border-rose-300 hover:shadow-md" 
        : "bg-indigo-50/80 border-indigo-200 hover:border-indigo-300 hover:shadow-md"
    }`}>
      {isAlert && <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/40 blur-3xl rounded-full -z-10 group-hover/section:bg-rose-200/60 transition-colors"></div>}
      {!isAlert && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/40 blur-3xl rounded-full -z-10 group-hover/section:bg-indigo-200/60 transition-colors"></div>}

      <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${isAlert ? "border-rose-200" : "border-indigo-200"}`}>
        {isAlert ? (
          <div className="relative flex min-h-[12px] min-w-[12px]">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 shadow-sm"></span>
          </div>
        ) : (
          <div className="relative flex min-h-[12px] min-w-[12px]">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 shadow-sm"></span>
          </div>
        )}
        <div className={`text-[12px] font-bold uppercase tracking-widest ${isAlert ? "text-rose-600" : "text-indigo-600"}`}>
          {props.title}
        </div>
      </div>
      <div className="text-sm font-medium z-10 relative">{props.children}</div>
    </div>
  );
}

export default function CausalAnalysisPanel(props: {
  recommendations: Recommendation[];
  graphContext: GraphContextPayload | null;
  graphAlerts: Array<Record<string, unknown>>;
}) {
  const { recommendations, graphContext, graphAlerts } = props;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-xl group/panel transition-all duration-500 hover:border-violet-300 hover:shadow-2xl">
      <div className="pointer-events-none absolute -inset-px rounded-2xl border border-slate-200 opacity-50"></div>
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl mix-blend-multiply"></div>

      <div className="relative flex items-start justify-between gap-4 z-10">
        <div>
          <h2 className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-indigo-600 bg-clip-text font-display text-2xl font-bold tracking-tight text-transparent">
            Causal analysis
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-lg font-medium leading-relaxed">
            Root-cause hypotheses and graph-backed explanations (knowledge graph pipeline).
          </p>
        </div>
        {graphAlerts.length > 0 ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
            {graphAlerts.length} alert{graphAlerts.length === 1 ? "" : "s"}
          </div>
        ) : null}
      </div>

      {graphContext?.root_cause ? (
        <div className="mt-6 relative z-10">
          <Section title="Portfolio root-cause hypothesis">{graphContext.root_cause}</Section>
        </div>
      ) : (
        <div className="mt-6 text-sm text-slate-500 font-medium italic relative z-10">
          No graph context yet — run analysis to populate causal signals.
        </div>
      )}

      <div className="mt-6 space-y-4 md:grid md:grid-cols-2 md:space-y-0 md:gap-4 relative z-10">
        <Section title="Graph Context (Risk factors)" type="context">
          <ul className="mt-1 space-y-3">
            {(graphContext?.risk_factors || []).map((c, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-slate-700 leading-relaxed font-medium">{c}</span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Anomaly Alerts" type="alert">
          {graphAlerts && graphAlerts.length > 0 ? (
            <ul className="mt-1 space-y-3">
              {graphAlerts.map((a, i) => (
                <li key={i} className="flex items-start gap-3 bg-white/60 border border-rose-200 p-3 rounded-lg shadow-sm group/alert hover:bg-rose-50 transition-colors">
                  <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 group-hover/alert:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span className="text-rose-800 font-bold leading-relaxed">{(a.detail as string) || JSON.stringify(a)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 italic font-medium p-3 bg-white/60 rounded-lg border border-slate-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              No critical anomalies detected.
            </div>
          )}
        </Section>
      </div>

      <div className="mt-8 space-y-5 relative z-10">
        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest pl-1">Per recommendation causal path</div>
        {recommendations.length === 0 ? (
          <div className="text-sm text-slate-500 font-medium italic bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">No recommendations to analyze.</div>
        ) : (
          recommendations.map((rec, idx) => (
            <div
              key={`${rec.action}-${idx}`}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 p-6 space-y-5 transition-all shadow-inner hover:bg-white hover:border-slate-300 hover:shadow-md group"
            >
              <div className="pointer-events-none absolute -left-1/2 -top-1/2 h-full w-full rotate-12 bg-gradient-to-r from-transparent via-slate-200/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100 duration-700"></div>
              
              <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Target Action</div>
                  <div className="text-base font-bold text-slate-900 leading-tight">{rec.action}</div>
                </div>
                <span className="flex h-fit items-center px-3 py-1.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold tracking-wide shadow-sm">
                  {rec.source || "—"}
                </span>
              </div>

              <Section title="Causal reason (audit)">{rec.reason || rec.justification}</Section>

              {rec.cause_explanation ? (
                <Section title="Graph impact narrative">{rec.cause_explanation}</Section>
              ) : null}

              {rec.causal_impact?.affected_services && rec.causal_impact.affected_services.length > 0 ? (
                <Section title="Affected services (graph)">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {rec.causal_impact.affected_services.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded border border-slate-300 bg-white shadow-sm text-xs text-slate-700 font-medium">{s}</span>
                    ))}
                  </div>
                </Section>
              ) : null}

              {rec.causal_impact?.risk_factors && rec.causal_impact.risk_factors.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm relative overflow-hidden group/risk transition-all hover:border-amber-300 hover:shadow-md">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/50 blur-3xl rounded-full -z-10 group-hover/risk:bg-amber-200/80 transition-colors"></div>
                  
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-200">
                    <div className="relative flex min-h-[12px] min-w-[12px]">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-sm"></span>
                    </div>
                    <div className="text-[12px] font-bold uppercase tracking-widest text-amber-600">
                      Execution Risk Factors
                    </div>
                  </div>
                  
                  <ul className="mt-1 space-y-3 z-10 relative">
                    {rec.causal_impact.risk_factors.map((rf, j) => (
                      <li key={j} className="flex items-start gap-3 bg-white/60 border border-amber-200 p-3 rounded-lg shadow-sm group/risk-item hover:bg-white transition-colors">
                        <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 group-hover/risk-item:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span className="text-amber-800 font-bold leading-relaxed text-sm">{rf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
