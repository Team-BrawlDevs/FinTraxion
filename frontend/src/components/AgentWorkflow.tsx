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

  const humanWait = lastEvent?.event === "awaiting_human_approval" || activeNode === "human_approval";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-sky-200">Agent Workflow</h2>
          <p className="text-xs text-slate-400 mt-1">
            Discovery → knowledge graph → simulation → decision → execution → quantifiable impact → memory.
          </p>
        </div>

        {humanWait ? (
          <div className="px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-xs font-semibold">
            Awaiting human approval
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
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

      {/* Agent errors intentionally hidden in internal ops UI; inspect execution logs if needed. */}
    </div>
  );
}

