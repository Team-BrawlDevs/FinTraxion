import type { SimulationResult } from "@/lib/types";

export default function DigitalTwinPage(props: { results: SimulationResult[] }) {
  const { results } = props;

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center glass-card rounded-md min-h-[400px]">
        <h2 className="font-display text-xl text-ink mb-2">No simulations available</h2>
        <p className="text-sm text-muted max-w-md leading-relaxed">
          Run a workflow analysis to generate a digital twin. The engine tests permutations against your baseline usage data.
        </p>
      </div>
    );
  }

  const maxCost = Math.max(...results.map((r) => r.original_baseline_cost || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl text-ink">Digital twin sandbox</h2>
          <p className="text-sm text-muted mt-1">
            The model tested {results.length} scenarios before constraining final recommendations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {results.map((sim, i) => {
          const isSelected = sim.selected || i === 0;
          const origCost = sim.original_baseline_cost || 0;
          const newCost = sim.mutated_twin_baseline_cost || origCost;

          const origPct = maxCost > 0 ? (origCost / maxCost) * 100 : 0;
          const newPct = maxCost > 0 ? (newCost / maxCost) * 100 : 0;
          const diffPct = maxCost > 0 ? ((origCost - newCost) / maxCost) * 100 : 0;

          return (
            <div
              key={sim.scenario?.id || i}
              className={`p-6 rounded-md border relative overflow-hidden transition-all duration-300 glass-card ${
                isSelected
                  ? "border-primary/40 shadow-card-hover ring-1 ring-primary/15"
                  : "border-edge hover:border-primary/25"
              }`}
            >
              {isSelected ? (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              ) : null}

              <div className="flex flex-col lg:flex-row gap-8 lg:items-start justify-between pl-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-ink font-display">
                      {sim.scenario?.name || "Hypothetical scenario"}
                    </h3>
                    {isSelected ? (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 bg-success-light px-2 py-1 rounded-md border border-emerald-200">
                        Top strategy
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-muted">
                    Mutation:{" "}
                    <span className="text-ink font-medium capitalize">
                      {(sim.scenario?.type || "").replace(/_/g, " ")}
                    </span>{" "}
                    on{" "}
                    <span className="text-primary-dark font-medium px-1.5 py-0.5 ml-1 bg-primary-light rounded-md border border-primary/15">
                      {sim.scenario?.target || "Unknown"}
                    </span>
                  </div>

                  <div className="mt-8 space-y-5 max-w-2xl">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-muted mb-2 tracking-wide uppercase">
                        <span>Baseline ecosystem cost</span>
                        <span className="font-mono text-ink">₹{Math.round(origCost).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-5 w-full bg-gray-200 rounded-full overflow-hidden border border-edge">
                        <div
                          className="h-full bg-gray-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${origPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-muted mb-2 tracking-wide uppercase">
                        <span className="text-emerald-800">Simulated future state</span>
                        <span className="font-mono text-emerald-800">₹{Math.round(newCost).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-5 w-full bg-gray-200 rounded-full overflow-hidden border border-edge flex relative">
                        <div
                          className="h-full bg-emerald-500 rounded-l-full transition-all duration-1000 ease-out"
                          style={{ width: `${newPct}%` }}
                        />
                        <div
                          className="h-full bg-emerald-800/80 rounded-r-full flex items-center justify-center transition-all duration-1000 overflow-hidden"
                          style={{ width: `${diffPct}%` }}
                        >
                          <div className="w-full h-full opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,1)_5px,rgba(255,255,255,1)_10px)]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-6 lg:gap-4 min-w-[200px] shrink-0 justify-between lg:text-right pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-edge lg:pl-6">
                  <div>
                    <div className="text-xs text-muted tracking-wide uppercase mb-1 font-semibold">
                      Predicted savings
                    </div>
                    <div
                      className={`text-4xl font-extrabold tracking-tight font-display ${(sim.predicted_savings || 0) > 0 ? "text-emerald-800" : "text-muted"}`}
                    >
                      ₹{Math.round(sim.predicted_savings || 0).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 lg:mt-auto">
                    <div>
                      <div className="text-[10px] text-muted tracking-wide uppercase font-semibold">Confidence</div>
                      <div className="text-base font-bold text-ink mt-0.5">
                        {((sim.confidence || 0) * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted tracking-wide uppercase font-semibold">Score</div>
                      <div className="text-base font-bold text-primary-dark mt-0.5">{(sim.score || 0).toFixed(2)}</div>
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
