import type { ImpactMetrics } from "@/lib/types";

type Props = {
  contextMemory: Record<string, unknown>;
  impactMetrics?: ImpactMetrics | null;
  learningUpdate?: Record<string, unknown> | null;
};

export default function ImpactSummary(props: Props) {
  const im =
    props.impactMetrics ||
    (props.contextMemory?.impact_metrics as ImpactMetrics | undefined);
  const cm = props.contextMemory || {};
  const learn =
    props.learningUpdate ||
    (cm.learning_signal as Record<string, unknown> | undefined);

  const totalCostBefore = Number(im?.before_cost ?? cm.total_cost_before ?? 0);
  const totalCostAfter = Number(im?.after_cost ?? cm.total_cost_after ?? 0);
  const realizedMonthly = Number(im?.savings ?? cm.total_savings ?? 0);
  const predicted = Number(im?.predicted_savings ?? 0);
  const variance = Number(im?.variance_predicted_vs_actual ?? 0);
  const roiMult = Number(im?.roi ?? 0);
  const effPct = Number(im?.efficiency_gain ?? 0);

  const totalSavingsYearly = realizedMonthly * 12;
  const maxCost = Math.max(totalCostBefore, 1);
  const afterPct = Math.max(
    0,
    Math.min(100, Math.round((totalCostAfter / maxCost) * 100)),
  );

  return (
    <div className="glass-card rounded-md p-5 glass-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink">Quantifiable impact</h2>
          <p className="text-xs text-muted mt-1">
            Baseline vs realized savings, ROI, and efficiency (post-execution).
          </p>
        </div>
        <div className="px-3 py-2 rounded-md bg-success-light border border-emerald-300 text-emerald-900 text-xs font-semibold">
          Impact pipeline
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-md border border-edge bg-gray-50/90 p-4">
          <div className="text-xs text-muted font-medium">Realized savings (mo)</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1 font-display">
            ₹{Math.round(realizedMonthly).toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-muted mt-1">
            Annualized ≈ ₹
            {Math.round(totalSavingsYearly).toLocaleString("en-IN")}
          </div>
        </div>

        <div className="rounded-md border border-edge bg-gray-50/90 p-4">
          <div className="text-xs text-muted font-medium">
            ROI (× annual vs est. change cost)
          </div>
          <div className="text-2xl font-bold text-primary-dark mt-1 font-display">
            {roiMult > 0 ? `${roiMult.toFixed(2)}×` : "—"}
          </div>
          <div className="text-xs text-muted mt-1">
            {im?.implementation_cost_estimate != null
              ? `Est. implementation ₹${Math.round(Number(im.implementation_cost_estimate)).toLocaleString("en-IN")}`
              : "Heuristic program cost"}
          </div>
        </div>

        <div className="rounded-md border border-edge bg-gray-50/90 p-4">
          <div className="text-xs text-muted font-medium">Efficiency gain</div>
          <div className="text-2xl font-bold text-warning mt-1 font-display">
            {effPct > 0 ? `${effPct.toFixed(2)}%` : "—"}
          </div>
          <div className="text-xs text-muted mt-1">Share of baseline cost removed</div>
        </div>
      </div>

      {(predicted > 0 || variance !== 0) && (
        <div className="mt-4 rounded-md border border-primary/20 bg-primary-light/40 p-3 text-xs text-ink">
          <span className="font-semibold text-primary-dark">Simulation vs execution: </span>
          predicted ₹{Math.round(predicted).toLocaleString("en-IN")}/mo · variance{" "}
          <span
            className={variance > 0 ? "text-warning font-semibold" : "text-emerald-700 font-semibold"}
          >
            {variance > 0 ? "−" : "+"}
            {Math.abs(Math.round(variance)).toLocaleString("en-IN")}
          </span>{" "}
          / mo (predicted − actual)
        </div>
      )}

      <div className="mt-6 rounded-md border border-edge bg-white p-4">
        <h3 className="text-sm font-bold text-ink mb-4 font-sans">
          Before / after (monthly baseline)
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted">Before optimization</span>
              <span className="font-bold text-ink tracking-wide font-mono">
                ₹{Math.round(totalCostBefore).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="bg-gray-400 h-full rounded-full transition-all duration-1000 ease-in-out w-full" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted">After optimization (realized)</span>
              <span className="font-bold text-emerald-800 tracking-wide font-mono">
                ₹{Math.round(totalCostAfter).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-in-out shadow-sm"
                style={{ width: `${afterPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {learn && Object.keys(learn).length > 0 ? (
        <div className="mt-4 rounded-md border border-edge bg-gray-50 p-3 text-xs text-ink">
          <span className="font-semibold text-ink">Learning signal: </span>
          predicted ₹
          {Math.round(Number(learn.predicted_savings ?? 0)).toLocaleString(
            "en-IN",
          )}{" "}
          · actual ₹
          {Math.round(Number(learn.actual_savings ?? 0)).toLocaleString(
            "en-IN",
          )}{" "}
          · variance ₹
          {Math.round(Number(learn.variance ?? 0)).toLocaleString("en-IN")}{" "}
          (fed back into global memory)
        </div>
      ) : null}
    </div>
  );
}
