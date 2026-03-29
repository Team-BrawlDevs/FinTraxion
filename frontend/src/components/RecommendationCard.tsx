import type { Recommendation } from "@/lib/types";

function riskStyles(risk: Recommendation["risk"]) {
  if (risk === "high") {
    return {
      cardBg: "bg-white border-rose-200 hover:border-rose-300 hover:shadow-md",
      pill: "bg-rose-50 border-rose-200 text-rose-700 shadow-sm",
      accent: "from-rose-200/40 to-rose-300/10",
    };
  }
  if (risk === "medium") {
    return {
      cardBg: "bg-white border-amber-200 hover:border-amber-300 hover:shadow-md",
      pill: "bg-amber-50 border-amber-200 text-amber-700 shadow-sm",
      accent: "from-amber-200/40 to-amber-300/10",
    };
  }
  return {
    cardBg: "bg-white border-slate-200 text-slate-800 hover:border-emerald-300 hover:shadow-md",
    pill: "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm",
    accent: "from-emerald-200/40 to-emerald-300/10",
  };
}

export default function RecommendationCard(props: {
  rec: Recommendation;
  disabled: boolean;
}) {
  const { rec, disabled } = props;
  const styles = riskStyles(rec.risk);

  return (
    <div className={`group relative overflow-hidden rounded-xl border ${styles.cardBg} p-5 transition-all duration-300 ${disabled ? 'opacity-50 grayscale select-none' : ''}`}>
      <div className={`absolute top-0 right-0 h-32 w-32 -translate-y-10 translate-x-10 rounded-full bg-gradient-to-br ${styles.accent} blur-2xl transition-opacity opacity-40 group-hover:opacity-100`}></div>
      
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-2">Action</div>
          <div className="text-base font-bold text-slate-900 mt-1 leading-snug">{rec.action}</div>
        </div>

        <div className="flex flex-col items-end gap-2.5 shrink-0">
          <span className={`px-3 py-1.5 rounded-md text-[11px] uppercase tracking-wider border font-bold ${styles.pill}`}>
            Risk: {rec.risk}
          </span>
          <span className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-widest shadow-sm">
            {Math.round((rec.confidence || 0) * 100)}% conf
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-5 flex flex-wrap gap-2 text-[11px] font-bold tracking-wide">
        <span className="px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm">
          Savings: ₹{Math.round(Number(rec.savings || 0)).toLocaleString("en-IN")}/mo
        </span>
        <span className="px-2.5 py-1 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm">
          Type: {rec.action_type}
        </span>
      </div>

      {rec.reason || rec.source ? (
        <div className="relative z-10 mt-5 rounded border border-indigo-100 bg-indigo-50/80 p-4 shadow-sm">
          <div className="text-[10px] text-indigo-700 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Causal audit
          </div>
          {rec.reason ? (
            <div className="text-[13px] font-medium text-slate-700 leading-relaxed">{rec.reason}</div>
          ) : null}
          {rec.source ? (
            <div className="text-[10px] font-bold text-indigo-500 mt-2 uppercase tracking-widest">Source: <span className="text-indigo-700">{rec.source}</span></div>
          ) : null}
        </div>
      ) : null}

      <div className="relative z-10 mt-6 pt-5 border-t border-slate-200">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">AI reasoning</div>
        <div className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50/80 p-4 rounded-xl border border-slate-200 shadow-inner">{rec.justification}</div>
      </div>
    </div>
  );
}
