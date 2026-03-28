import type { SimulationResult } from "@/lib/types";

export default function DigitalTwinPage(props: { results: SimulationResult[] }) {
  const { results } = props;

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 shadow-sm min-h-[400px]">
        <h2 className="text-xl font-bold text-slate-400 mb-2">No Simulations Available</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Run a workflow analysis to generate a Digital Twin. The predictive engine will mathematically test permutations against your baseline usage data.
        </p>
      </div>
    );
  }

  // Find the highest cost across all simulations to scale the horizontal bar graphs dynamically
  const maxCost = Math.max(...results.map(r => r.original_baseline_cost || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-sky-200">Digital Twin Sandbox</h2>
          <p className="text-sm text-slate-400 mt-1">
            The mathematical model autonomously tested {results.length} functional futures before constraining the final AI recommendations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {results.map((sim, i) => {
          const isSelected = sim.selected || i === 0;
          const origCost = sim.original_baseline_cost || 0;
          const newCost = sim.mutated_twin_baseline_cost || origCost;
          
          // Relative percentage widths
          const origPct = maxCost > 0 ? (origCost / maxCost) * 100 : 0;
          const newPct = maxCost > 0 ? (newCost / maxCost) * 100 : 0;
          const diffPct = maxCost > 0 ? ((origCost - newCost) / maxCost) * 100 : 0;

          return (
            <div 
              key={sim.scenario?.id || i}
              className={`p-6 rounded-2xl border relative overflow-hidden transition-all duration-300 ${
                isSelected 
                  ? 'border-sky-500/50 bg-sky-950/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]' 
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500" />
              )}
              
              <div className="flex flex-col lg:flex-row gap-8 lg:items-start justify-between pl-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-100">{sim.scenario?.name || "Unknown Hypothetical Scenario"}</h3>
                    {isSelected && (
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        Top Strategy Constraint
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">
                    Functional Mutation: <span className="text-slate-300 font-medium capitalize">{(sim.scenario?.type || "").replace(/_/g, " ")}</span> deployed against <span className="text-sky-300 font-medium px-1.5 py-0.5 ml-1 bg-sky-500/10 rounded">{sim.scenario?.target || "Unknown"}</span>
                  </div>

                  {/* Horizontal Bar Graph View */}
                  <div className="mt-8 space-y-5 max-w-2xl">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2 tracking-wide uppercase">
                        <span>Baseline Ecosystem Cost</span>
                        <span>₹{Math.round(origCost).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-5 w-full bg-slate-800/50 rounded-full overflow-hidden shadow-inner border border-slate-800">
                        <div 
                          className="h-full bg-slate-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${origPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2 tracking-wide uppercase">
                        <span className="text-emerald-400">Simulated Future State</span>
                        <span className="text-emerald-400">₹{Math.round(newCost).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-5 w-full bg-slate-800/50 rounded-full overflow-hidden shadow-inner border border-slate-800 flex relative">
                        <div 
                          className="h-full bg-emerald-500 rounded-l-full transition-all duration-1000 ease-out"
                          style={{ width: `${newPct}%` }}
                        />
                        {/* Render the difference as a distinct stacked bar segment */}
                        <div 
                          className="h-full bg-emerald-900/60 rounded-r-full flex items-center justify-center transition-all duration-1000 overflow-hidden"
                          style={{ width: `${diffPct}%` }}
                        >
                          <div className="w-full h-full opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,1)_5px,rgba(255,255,255,1)_10px)]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-6 lg:gap-4 min-w-[200px] shrink-0 justify-between lg:text-right pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-800/60 lg:pl-6">
                  <div>
                    <div className="text-xs text-slate-500 tracking-wide uppercase mb-1 font-semibold">Predicted Core Savings</div>
                    <div className={`text-4xl font-extrabold tracking-tight ${(sim.predicted_savings || 0) > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      ₹{Math.round(sim.predicted_savings || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 lg:mt-auto">
                    <div>
                      <div className="text-[10px] text-slate-500 tracking-wide uppercase font-semibold">Confidence</div>
                      <div className="text-base font-bold text-slate-200 mt-0.5">{((sim.confidence || 0) * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 tracking-wide uppercase font-semibold">Heuristic</div>
                      <div className="text-base font-bold text-sky-400 mt-0.5">{(sim.score || 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
