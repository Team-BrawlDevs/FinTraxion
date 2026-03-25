export default function ImpactSummary(props: { contextMemory: any }) {
  const totalSavingsMonthly = Number(props.contextMemory?.total_savings || 0);
  const totalSavingsYearly = totalSavingsMonthly * 12;

  const roiPct = totalSavingsYearly > 0 ? Math.min(999, Math.round(120 + totalSavingsYearly / 200000)) : 0;
  const efficiencyGain = totalSavingsMonthly > 0 ? `+${Math.min(60, 15 + Math.round(totalSavingsMonthly / 5000))}%` : "+0%";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-sky-200">Impact Summary</h2>
          <p className="text-xs text-slate-400 mt-1">Estimated business impact based on recommendations (mocked/heuristic).</p>
        </div>
        <div className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-200 text-xs">
          Run-level execution
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
          <div className="text-xs text-slate-400">Total Savings</div>
          <div className="text-2xl font-extrabold text-emerald-200 mt-1">
            ₹{Math.round(totalSavingsYearly).toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-400 mt-1">Per year (estimated)</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
          <div className="text-xs text-slate-400">ROI</div>
          <div className="text-2xl font-extrabold text-sky-200 mt-1">{roiPct}%</div>
          <div className="text-xs text-slate-400 mt-1">vs current baseline (mock)</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
          <div className="text-xs text-slate-400">Efficiency Gain</div>
          <div className="text-2xl font-extrabold text-amber-200 mt-1">{efficiencyGain}</div>
          <div className="text-xs text-slate-400 mt-1">Operational throughput (mock)</div>
        </div>
      </div>
    </div>
  );
}

