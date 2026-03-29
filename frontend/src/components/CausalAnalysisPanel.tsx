import type { ReactNode } from "react";
import type { GraphContextPayload, Recommendation } from "@/lib/types";

function Section(props: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-primary/15 bg-primary-light/35 p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-primary-dark">
        {props.title}
      </div>
      <div className="mt-2 text-sm text-ink leading-relaxed">{props.children}</div>
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
    <div className="glass-card rounded-md p-5 glass-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink">Causal analysis</h2>
          <p className="text-xs text-muted mt-1">
            Root-cause hypotheses and graph-backed explanations (knowledge graph pipeline).
          </p>
        </div>
        {graphAlerts.length > 0 ? (
          <div className="px-3 py-2 rounded-md bg-warning-light border border-warning/30 text-warning text-xs font-semibold">
            {graphAlerts.length} alert{graphAlerts.length === 1 ? "" : "s"}
          </div>
        ) : null}
      </div>

      {graphContext?.root_cause ? (
        <div className="mt-4">
          <Section title="Portfolio root-cause hypothesis">{graphContext.root_cause}</Section>
        </div>
      ) : (
        <div className="mt-4 text-sm text-muted">
          No graph context yet — run analysis to populate causal signals.
        </div>
      )}

      {graphAlerts.length > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold text-warning">Anomaly alerts</div>
          <ul className="space-y-2">
            {graphAlerts.map((a, i) => (
              <li
                key={i}
                className="rounded-md border border-warning/25 bg-warning-light/60 px-3 py-2 text-xs text-ink"
              >
                {(a.detail as string) || JSON.stringify(a)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <div className="text-xs font-semibold text-ink uppercase tracking-wide">Per recommendation</div>
        {recommendations.length === 0 ? (
          <div className="text-sm text-muted">No recommendations to analyze.</div>
        ) : (
          recommendations.map((rec, idx) => (
            <div
              key={`${rec.action}-${idx}`}
              className="rounded-md border border-edge bg-gray-50/90 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] text-muted">Action</div>
                  <div className="text-sm font-semibold text-ink">{rec.action}</div>
                </div>
                <span className="px-2 py-1 rounded-md bg-primary-light border border-primary/20 text-primary-dark text-[11px] font-medium">
                  {rec.source || "—"}
                </span>
              </div>

              <Section title="Causal reason (audit)">{rec.reason || rec.justification}</Section>

              {rec.cause_explanation ? (
                <Section title="Impact & cause narrative">{rec.cause_explanation}</Section>
              ) : null}

              {rec.causal_impact?.affected_services && rec.causal_impact.affected_services.length > 0 ? (
                <Section title="Affected services (graph)">
                  {rec.causal_impact.affected_services.join(", ")}
                </Section>
              ) : null}

              {rec.causal_impact?.risk_factors && rec.causal_impact.risk_factors.length > 0 ? (
                <div className="rounded-md border border-danger/20 bg-danger-light/50 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-danger">
                    Risk factors
                  </div>
                  <ul className="mt-2 list-disc pl-5 text-xs text-ink space-y-1">
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
