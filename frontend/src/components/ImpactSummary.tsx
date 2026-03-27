export default function ImpactSummary(props: { contextMemory: any }) {
  // Extract values populated by the MemoryUpdateAgent
  const totalCostBefore = Number(props.contextMemory?.total_cost_before || 0);
  const totalSavingsMonthly = Number(props.contextMemory?.total_savings || 0);
  const totalCostAfter = Number(props.contextMemory?.total_cost_after || 0);

  const totalSavingsYearly = totalSavingsMonthly * 12;

  // Restore the original ROI and Efficiency Gain heuristics
  const roiPct = totalSavingsYearly > 0 ? Math.min(999, Math.round(120 + totalSavingsYearly / 200000)) : 0;
  const efficiencyGain = totalSavingsMonthly > 0 ? `+${Math.min(60, 15 + Math.round(totalSavingsMonthly / 5000))}%` : "+0%";

  // Calculating bar widths relative to totalCostBefore
  const maxCost = Math.max(totalCostBefore, 1); // Avoid division by 0
  const afterPct = Math.max(0, Math.min(100, Math.round((totalCostAfter / maxCost) * 100)));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-sky-200">Impact Summary</h2>
          <p className="text-xs text-slate-400 mt-1">Estimated business impact based on recommendations.</p>
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

      <div className="mt-6 rounded-xl border border-slate-800/50 bg-slate-950/20 p-4">
        <h3 className="text-sm font-bold text-slate-300 mb-4">Cost Analysis (Monthly Baseline)</h3>
        
        <div className="space-y-4">
          {/* Before Optimization Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Before Optimization</span>
              <span className="font-bold text-slate-200 tracking-wide">
                ₹{Math.round(totalCostBefore).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-slate-500 h-full rounded-full transition-all duration-1000 ease-in-out" 
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>

          {/* After Optimization Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">After Optimization</span>
              <span className="font-bold text-emerald-400 tracking-wide">
                ₹{Math.round(totalCostAfter).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] h-full rounded-full transition-all duration-1000 ease-in-out" 
                style={{ width: `${afterPct}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
