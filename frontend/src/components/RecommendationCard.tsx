import type { Recommendation } from "@/lib/types";

function riskStyles(risk: Recommendation["risk"]) {
  if (risk === "high") {
    return {
      border: "border-rose-500/30",
      bg: "bg-rose-500/10",
      pill: "bg-rose-500/10 border-rose-500/30 text-rose-200",
    };
  }
  if (risk === "medium") {
    return {
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      pill: "bg-amber-500/10 border-amber-500/30 text-amber-200",
    };
  }
  return {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    pill: "bg-emerald-500/10 border-emerald-500/30 text-emerald-200",
  };
}

export default function RecommendationCard(props: {
  rec: Recommendation;
  disabled: boolean;
}) {
  const { rec, disabled } = props;
  const styles = riskStyles(rec.risk);

  return (
    <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Action</div>
          <div className="text-sm font-bold text-slate-100 mt-1">{rec.action}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-1 rounded-lg text-xs border ${styles.pill}`}>
            Risk: {rec.risk}
          </span>
          <span className="px-2 py-1 rounded-lg bg-slate-800/40 border border-slate-700 text-slate-200 text-xs">
            {Math.round((rec.confidence || 0) * 100)}% confidence
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-200">
          Savings: ₹{Math.round(Number(rec.savings || 0)).toLocaleString("en-IN")}/mo (mock)
        </span>
        <span className="px-2 py-1 rounded-lg bg-slate-800/40 border border-slate-700 text-slate-300">
          Type: {rec.action_type}
        </span>
      </div>

      <div className="mt-3">
        <div className="text-xs text-slate-400">AI Reasoning</div>
        <div className="text-sm text-slate-200 leading-relaxed mt-1">{rec.justification}</div>
      </div>
    </div>
  );
}

