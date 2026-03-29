import type { Recommendation } from "@/lib/types";
import RecommendationCard from "./RecommendationCard";

export default function RecommendationsPanel(props: {
  recommendations: Recommendation[];
  needsHumanApproval: boolean;
  disabled?: boolean;
}) {
  const { recommendations, needsHumanApproval, disabled } = props;

  return (
    <div className="glass-card rounded-md p-5 glass-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink">AI recommendations</h2>
          <p className="text-xs text-muted mt-1">
            Multi-agent outputs as executable actions (run-level approval).
          </p>
        </div>

        {needsHumanApproval ? (
          <div className="px-3 py-2 rounded-md bg-warning-light border border-warning/30 text-warning text-xs font-semibold">
            Approval required
          </div>
        ) : (
          <div className="px-3 py-2 rounded-md bg-success-light border border-emerald-300 text-emerald-900 text-xs font-semibold">
            Ready for execution
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {recommendations.length === 0 ? (
          <div className="text-sm text-muted lg:col-span-2">
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
