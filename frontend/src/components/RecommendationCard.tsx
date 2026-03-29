import type { Recommendation } from "@/lib/types";

function riskStyles(risk: Recommendation["risk"]) {
  if (risk === "high") {
    return {
      border: "border-danger/25",
      bg: "bg-danger-light/60",
      pill: "bg-danger-light border-danger/30 text-danger",
    };
  }
  if (risk === "medium") {
    return {
      border: "border-warning/30",
      bg: "bg-warning-light/80",
      pill: "bg-warning-light border-warning/40 text-warning",
    };
  }
  return {
    border: "border-emerald-200",
    bg: "bg-success-light/60",
    pill: "bg-success-light border-emerald-300 text-emerald-900",
  };
}

export default function RecommendationCard(props: {
  rec: Recommendation;
  disabled: boolean;
}) {
  const { rec } = props;
  const styles = riskStyles(rec.risk);

  return (
    <div className={`rounded-md border ${styles.border} ${styles.bg} p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted uppercase tracking-wide">Action</div>
          <div className="text-sm font-bold text-ink mt-1">{rec.action}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-1 rounded-md text-xs border font-medium ${styles.pill}`}>
            Risk: {rec.risk}
          </span>
          <span className="px-2 py-1 rounded-md bg-gray-100 border border-edge text-muted text-xs font-medium">
            {Math.round((rec.confidence || 0) * 100)}% confidence
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 rounded-md bg-primary-light border border-primary/20 text-primary-dark font-medium">
          Savings: ₹{Math.round(Number(rec.savings || 0)).toLocaleString("en-IN")}/mo
        </span>
        <span className="px-2 py-1 rounded-md bg-gray-100 border border-edge text-muted font-medium">
          Type: {rec.action_type}
        </span>
      </div>

      {rec.reason || rec.source ? (
        <div className="mt-3 rounded-md border border-primary/15 bg-primary-light/40 p-3">
          <div className="text-[11px] text-primary-dark font-semibold uppercase tracking-wide">
            Causal audit
          </div>
          {rec.reason ? (
            <div className="text-sm text-ink mt-1 leading-relaxed">{rec.reason}</div>
          ) : null}
          {rec.source ? (
            <div className="text-[11px] text-muted mt-2">Source: {rec.source}</div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3">
        <div className="text-xs text-muted">AI reasoning</div>
        <div className="text-sm text-ink leading-relaxed mt-1">{rec.justification}</div>
      </div>
    </div>
  );
}
