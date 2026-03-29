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
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-xl h-full transition-all duration-500 hover:border-teal-300 hover:shadow-2xl">
      <div className="pointer-events-none absolute -inset-px rounded-2xl border border-slate-200 opacity-50"></div>
      <div className="pointer-events-none absolute top-20 right-20 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl mix-blend-multiply"></div>

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <h2 className="bg-gradient-to-r from-emerald-700 via-teal-600 to-green-600 bg-clip-text font-display text-2xl font-bold tracking-tight text-transparent">
            Quantifiable impact
          </h2>
          <p className="text-sm text-slate-600 mt-2 font-medium max-w-sm leading-relaxed">
            Baseline vs realized savings, ROI, and efficiency (post-execution).
          </p>
        </div>
        <div className="px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold shadow-sm">
          Impact pipeline
        </div>
      </div>

      <div className="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="group rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm transition-colors hover:bg-white hover:border-emerald-300 hover:shadow-md">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Realized savings (mo)</div>
          <div className="text-3xl font-bold mt-3 font-display text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-teal-600 drop-shadow-sm group-hover:scale-[1.02] origin-left transition-transform">
            ₹{Math.round(realizedMonthly).toLocaleString("en-IN")}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-3 pt-3 border-t border-slate-200">
            Annualized ≈ <span className="text-emerald-700 font-bold">₹{Math.round(totalSavingsYearly).toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="group rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm transition-colors hover:bg-white hover:border-indigo-300 hover:shadow-md">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
            ROI (ann. vs change cost)
          </div>
          <div className="text-3xl font-bold mt-3 font-display text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-cyan-600 drop-shadow-sm group-hover:scale-[1.02] origin-left transition-transform">
            {roiMult > 0 ? `${roiMult.toFixed(2)}×` : "—"}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-3 pt-3 border-t border-slate-200">
            {im?.implementation_cost_estimate != null
              ? `Est. implementation ₹${Math.round(Number(im.implementation_cost_estimate)).toLocaleString("en-IN")}`
              : "Heuristic program cost"}
          </div>
        </div>

        <div className="group rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm transition-colors hover:bg-white hover:border-amber-300 hover:shadow-md">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Efficiency gain</div>
          <div className="text-3xl font-bold mt-3 font-display text-transparent bg-clip-text bg-gradient-to-br from-amber-600 to-orange-600 drop-shadow-sm group-hover:scale-[1.02] origin-left transition-transform">
            {effPct > 0 ? `${effPct.toFixed(2)}%` : "—"}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-3 pt-3 border-t border-slate-200">Share of baseline cost removed</div>
        </div>
      </div>

      {(predicted > 0 || variance !== 0) && (
        <div className="relative z-10 mt-5 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 text-xs font-medium text-slate-700 shadow-sm">
          <span className="font-bold text-indigo-700 uppercase tracking-widest text-[10px]">Simulation vs execution: </span>
          predicted <span className="text-slate-900">₹{Math.round(predicted).toLocaleString("en-IN")}/mo</span> · variance{" "}
          <span
            className={variance > 0 ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}
          >
            {variance > 0 ? "−" : "+"}
            {Math.abs(Math.round(variance)).toLocaleString("en-IN")}
          </span>{" "}
          / mo <span className="opacity-60 text-[10px]">(pred − act)</span>
        </div>
      )}

      <div className="relative z-10 mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6 border-b border-slate-200 pb-3">
          Before / after (monthly baseline)
        </h3>

        <div className="space-y-6">
          <div className="relative">
            <div className="flex justify-between items-end mb-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Before optimization</span>
              <span className="text-base font-bold text-slate-900 font-mono tracking-wider">
                ₹{Math.round(totalCostBefore).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 shadow-inner overflow-hidden border border-slate-300">
              <div className="bg-gradient-to-r from-slate-400 to-slate-300 h-full rounded-full transition-all duration-1000 ease-in-out w-full opacity-60" />
            </div>
          </div>

          <div className="relative">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> After optimization (realized)</span>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 font-mono tracking-wider">
                ₹{Math.round(totalCostAfter).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3.5 shadow-inner overflow-hidden border border-slate-300 relative">
              <div
                className="absolute top-0 left-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 h-full rounded-full transition-all duration-1000 ease-in-out shadow-sm"
                style={{ width: `${afterPct}%` }}
              >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMjBMMjAgMEgxMEwwIDEwWiIgZmlsbD0ibibGFjayIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] background-size-[20px_20px] opacity-20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {learn && Object.keys(learn).length > 0 ? (
        <div className="relative z-10 mt-5 rounded-xl border border-teal-200 bg-teal-50/80 p-4 text-[11px] font-medium text-slate-600 flex items-start gap-3 shadow-sm">
          <svg className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <div>
            <span className="font-bold text-teal-700 uppercase tracking-widest text-[10px] block mb-1">Learning signal broadcast</span>
            predicted <span className="text-slate-900">₹{Math.round(Number(learn.predicted_savings ?? 0)).toLocaleString("en-IN")}</span>{" "}
            · actual <span className="text-slate-900">₹{Math.round(Number(learn.actual_savings ?? 0)).toLocaleString("en-IN")}</span>{" "}
            · variance <span className="text-amber-600">₹{Math.round(Number(learn.variance ?? 0)).toLocaleString("en-IN")}</span>{" "}
            <span className="text-slate-500 italic ml-1">(fed back into global memory)</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
