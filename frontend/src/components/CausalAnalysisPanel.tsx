import type { ReactNode } from "react";
import type { GraphContextPayload, Recommendation } from "@/lib/types";

function Section(props: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-violet-300/90">{props.title}</div>
      <div className="mt-2 text-sm text-slate-200 leading-relaxed">{props.children}</div>
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-violet-200">Causal analysis</h2>
          <p className="text-xs text-slate-400 mt-1">
            Root-cause hypotheses and graph-backed explanations mapped to each recommendation (from the Knowledge Graph
            pipeline).
          </p>
        </div>
        {graphAlerts.length > 0 ? (
          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-semibold">
            {graphAlerts.length} alert{graphAlerts.length === 1 ? "" : "s"}
          </div>
        ) : null}
      </div>

      {graphContext?.root_cause ? (
        <div className="mt-4">
          <Section title="Portfolio root-cause hypothesis">{graphContext.root_cause}</Section>
        </div>
      ) : (
        <div className="mt-4 text-sm text-slate-500">No graph context yet — run analysis to populate causal signals.</div>
      )}

      {graphAlerts.length > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold text-amber-200/90">Anomaly alerts</div>
          <ul className="space-y-2">
            {graphAlerts.map((a, i) => (
              <li
                key={i}
                className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2 text-xs text-amber-100/90"
              >
                {(a.detail as string) || JSON.stringify(a)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <div className="text-xs font-semibold text-slate-300">Per recommendation</div>
        {recommendations.length === 0 ? (
          <div className="text-sm text-slate-500">No recommendations to analyze.</div>
        ) : (
          recommendations.map((rec, idx) => (
            <div
              key={`${rec.action}-${idx}`}
              className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] text-slate-500">Action</div>
                  <div className="text-sm font-semibold text-slate-100">{rec.action}</div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-200 text-[11px]">
                  {rec.source || "—"}
                </span>
              </div>

              <Section title="Causal reason (audit)">{rec.reason || rec.justification}</Section>

              {rec.cause_explanation ? <Section title="Impact & cause narrative">{rec.cause_explanation}</Section> : null}

              {rec.causal_impact?.affected_services && rec.causal_impact.affected_services.length > 0 ? (
                <Section title="Affected services (graph)">{rec.causal_impact.affected_services.join(", ")}</Section>
              ) : null}

              {rec.causal_impact?.risk_factors && rec.causal_impact.risk_factors.length > 0 ? (
                <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-rose-300/90">Risk factors</div>
                  <ul className="mt-2 list-disc pl-5 text-xs text-slate-200 space-y-1">
                    {rec.causal_impact.risk_factors.map((rf, j) => (
                      <li key={j}>{rf}</li>
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
