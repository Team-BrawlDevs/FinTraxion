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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-sky-200">
            Quantifiable impact
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Baseline vs realized savings, ROI, and efficiency from the Impact
            Engine (post-execution).
          </p>
        </div>
        <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs font-semibold">
          Impact pipeline
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
          <div className="text-xs text-slate-400">Realized savings (mo)</div>
          <div className="text-2xl font-extrabold text-emerald-200 mt-1">
            ₹{Math.round(realizedMonthly).toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Annualized ≈ ₹
            {Math.round(totalSavingsYearly).toLocaleString("en-IN")}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
          <div className="text-xs text-slate-400">
            ROI (× annual vs est. change cost)
          </div>
          <div className="text-2xl font-extrabold text-sky-200 mt-1">
            {roiMult > 0 ? `${roiMult.toFixed(2)}×` : "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {im?.implementation_cost_estimate != null
              ? `Est. implementation ₹${Math.round(Number(im.implementation_cost_estimate)).toLocaleString("en-IN")}`
              : "Heuristic program cost"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
          <div className="text-xs text-slate-400">Efficiency gain</div>
          <div className="text-2xl font-extrabold text-amber-200 mt-1">
            {effPct > 0 ? `${effPct.toFixed(2)}%` : "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Share of baseline cost removed
          </div>
        </div>
      </div>

      {(predicted > 0 || variance !== 0) && (
        <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-xs text-slate-200">
          <span className="font-semibold text-violet-200">
            Simulation vs execution:{" "}
          </span>
          predicted ₹{Math.round(predicted).toLocaleString("en-IN")}/mo ·
          variance{" "}
          <span
            className={variance > 0 ? "text-amber-300" : "text-emerald-300"}
          >
            {variance > 0 ? "−" : "+"}
            {Math.abs(Math.round(variance)).toLocaleString("en-IN")}
          </span>{" "}
          / mo (predicted − actual)
        </div>
      )}

      <div className="mt-6 rounded-xl border border-slate-800/50 bg-slate-950/20 p-4">
        <h3 className="text-sm font-bold text-slate-300 mb-4">
          Before / after (monthly baseline)
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Before optimization</span>
              <span className="font-bold text-slate-200 tracking-wide">
                ₹{Math.round(totalCostBefore).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden">
              <div className="bg-slate-500 h-full rounded-full transition-all duration-1000 ease-in-out w-full" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">
                After optimization (realized)
              </span>
              <span className="font-bold text-emerald-400 tracking-wide">
                ₹{Math.round(totalCostAfter).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] h-full rounded-full transition-all duration-1000 ease-in-out"
                style={{ width: `${afterPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {learn && Object.keys(learn).length > 0 ? (
        <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-950/30 p-3 text-xs text-slate-300">
          <span className="font-semibold text-slate-200">
            Learning signal:{" "}
          </span>
          predicted ₹
          {Math.round(Number(learn.predicted_savings ?? 0)).toLocaleString(
            "en-IN",
          )}{" "}
          · actual ₹
          {Math.round(Number(learn.actual_savings ?? 0)).toLocaleString(
            "en-IN",
          )}{" "}
          · variance ₹
          {Math.round(Number(learn.variance ?? 0)).toLocaleString("en-IN")} (fed
          back into global memory for calibration)
        </div>
      ) : null}
    </div>
  );
}
