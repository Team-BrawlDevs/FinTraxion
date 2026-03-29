import type { AgentEvent } from "@/lib/types";
import AgentStep from "./AgentStep";

const STEPS = [
  { node: "discovery", label: "Discovery" },
  { node: "normalization", label: "Normalization" },
  { node: "enrichment", label: "Usage" },
  { node: "duplicate_detection", label: "Detection" },
  { node: "kg_context", label: "Knowledge Graph" },
  { node: "digital_twin", label: "Digital Twin" },
  { node: "baseline", label: "Baseline" },
  { node: "evaluation", label: "Simulation" },
  { node: "decision", label: "Decision" },
  { node: "human_approval", label: "Approval" },
  { node: "execution", label: "Execution" },
  { node: "impact_analysis", label: "Impact" },
  { node: "roi", label: "ROI" },
  { node: "audit", label: "Audit" },
  { node: "learning", label: "Learning" },
  { node: "memory_update", label: "Memory" },
];

export default function AgentWorkflow(props: {
  lastEvent: AgentEvent | null;
  completedNodes: Set<string>;
  activeNode: string | null;
}) {
  const { lastEvent, completedNodes, activeNode } = props;

  const humanWait =
    lastEvent?.event === "awaiting_human_approval" ||
    activeNode === "human_approval";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-xl group/panel transition-all duration-500 hover:border-slate-300 hover:shadow-2xl">
      <div className="pointer-events-none absolute -inset-px rounded-2xl border border-slate-200 opacity-50"></div>
      <div className="pointer-events-none absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent"></div>

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <h2 className="bg-gradient-to-r from-indigo-900 to-slate-700 bg-clip-text font-display text-2xl font-bold tracking-tight text-transparent">
            Agent workflow
          </h2>
          <p className="text-sm text-slate-600 mt-2 font-medium max-w-2xl leading-relaxed">
            Discovery → knowledge graph → simulation → decision → execution →
            quantifiable impact → memory.
          </p>
        </div>

        {humanWait ? (
          <div className="px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold shadow-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Awaiting human approval
          </div>
        ) : null}
      </div>

      <div className="relative z-10 mt-6 flex flex-wrap gap-2.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200 shadow-inner">
        {STEPS.map((s) => {
          const isComplete = completedNodes.has(String(s.node));
          const isActive = activeNode === String(s.node);
          const isPending = !isComplete && !isActive;

          return (
            <AgentStep
              key={String(s.node)}
              label={s.label}
              isComplete={isComplete}
              isActive={isActive}
              isPending={isPending}
            />
          );
        })}
      </div>
    </div>
  );
}
