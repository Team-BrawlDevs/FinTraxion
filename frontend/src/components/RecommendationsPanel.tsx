import type { Recommendation } from "@/lib/types";
import RecommendationCard from "./RecommendationCard";

export default function RecommendationsPanel(props: {
  recommendations: Recommendation[];
  needsHumanApproval: boolean;
  disabled?: boolean;
}) {
  const { recommendations, needsHumanApproval, disabled } = props;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-xl transition-all duration-500 hover:border-emerald-300 hover:shadow-2xl">
      <div className="pointer-events-none absolute -inset-px rounded-2xl border border-slate-200 opacity-50"></div>
      <div className="pointer-events-none absolute -top-40 right-20 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl mix-blend-multiply"></div>

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <h2 className="bg-gradient-to-r from-emerald-700 via-teal-600 to-green-600 bg-clip-text font-display text-2xl font-bold tracking-tight text-transparent">
            AI recommendations
          </h2>
          <p className="text-sm text-slate-600 mt-2 font-medium max-w-sm leading-relaxed">
            Multi-agent outputs as executable actions (run-level approval).
          </p>
        </div>

        {needsHumanApproval ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold shadow-sm animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
            Approval required
          </div>
        ) : (
          <div className="px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
            Ready for execution
          </div>
        )}
      </div>

      <div className="relative z-10 mt-6 grid grid-cols-1 xl:grid-cols-2 gap-5">
        {recommendations.length === 0 ? (
          <div className="text-sm text-slate-500 italic font-medium xl:col-span-2 text-center py-8 bg-slate-50/80 rounded-xl border border-slate-200 shadow-inner">
            No recommendations yet. Run analysis to generate actions.
          </div>
        ) : (
          recommendations.map((rec) => (
            <RecommendationCard
              key={`${rec.action}-${rec.savings}`}
              rec={rec}
              disabled={disabled || !needsHumanApproval}
            />
          ))
        )}
      </div>
    </div>
  );
}
