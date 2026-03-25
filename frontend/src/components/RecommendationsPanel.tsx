import type { Recommendation } from "@/lib/types";
import RecommendationCard from "./RecommendationCard";

export default function RecommendationsPanel(props: {
  recommendations: Recommendation[];
  needsHumanApproval: boolean;
  disabled?: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { recommendations, needsHumanApproval, disabled, onApprove, onReject } = props;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-sky-200">AI Recommendations</h2>
          <p className="text-xs text-slate-400 mt-1">
            Multi-agent outputs are transformed into executable remediation actions (run-level approval).
          </p>
        </div>

        {needsHumanApproval ? (
          <div className="px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-xs font-semibold">
            Approval required
          </div>
        ) : (
          <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs font-semibold">
            Ready for execution
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {recommendations.length === 0 ? (
          <div className="text-sm text-slate-400 lg:col-span-2">No recommendations yet. Run analysis to generate actions.</div>
        ) : (
          recommendations.map((rec) => (
            <RecommendationCard
              key={`${rec.action}-${rec.savings}`}
              rec={rec}
              disabled={disabled || !needsHumanApproval}
              showButtons={needsHumanApproval}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))
        )}
      </div>
    </div>
  );
}

