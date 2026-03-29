import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type {
  DuplicateCandidate,
  Recommendation,
  GraphContextPayload,
} from "@/lib/types";
import { buildMockServices } from "@/lib/mock";
import AgentWorkflow from "@/components/AgentWorkflow";
import DetectedServicesPanel from "@/components/DetectedServicesPanel";
import DuplicateDetectionPanel from "@/components/DuplicateDetectionPanel";
import RecommendationsPanel from "@/components/RecommendationsPanel";
import DigitalTwinPage from "@/components/DigitalTwinPage";
import CausalAnalysisPanel from "@/components/CausalAnalysisPanel";
import Navbar from "@/components/layout/Navbar";
import BackgroundDecor from "@/components/ui/BackgroundDecor";
import { useOptimization } from "@/context/OptimizationContext";
import { pageTransition } from "@/utils/animations";

type TabState = "workflow" | "causal" | "digital_twin";

export default function Workspace() {
  const {
    uiState,
    runAnalysis,
    resetRun,
    lastEvent,
    activeNode,
    completedNodes,
    status,
    needsHumanApproval,
    approvalNotes,
    setApprovalNotes,
    approveBusy,
    onApprove,
    runId,
  } = useOptimization();

  const [currentTab, setCurrentTab] = useState<TabState>("workflow");

  const duplicateCandidates = (status.duplicate_candidates ||
    []) as DuplicateCandidate[];
  const recommendations = (status.recommendations || []) as Recommendation[];
  const services = useMemo(
    () => buildMockServices(duplicateCandidates),
    [duplicateCandidates],
  );

  return (
    <motion.div {...pageTransition} className="relative min-h-screen bg-background">
      <BackgroundDecor />
      <Navbar />

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 pt-24 pb-12">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-ink">
              Live optimization workspace
            </h1>
            <p className="text-sm text-muted mt-2 max-w-2xl leading-relaxed">
              Full LangGraph workflow: discovery through execution, with human-in-the-loop
              governance. Matches the FinTraXion-UI command center styling.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center justify-end">
            <div
              className={[
                "px-3 py-2 rounded-md border text-sm font-semibold",
                uiState === "Idle"
                  ? "bg-white border-edge text-muted"
                  : uiState === "Running"
                    ? "bg-primary-light border-primary/30 text-primary-dark"
                    : uiState === "Completed"
                      ? "bg-success-light border-emerald-300 text-emerald-900"
                      : "bg-danger-light border-danger/30 text-danger",
              ].join(" ")}
            >
              Status: {uiState}
            </div>

            <button
              type="button"
              onClick={() => runAnalysis()}
              disabled={uiState === "Running"}
              className="btn-primary text-sm py-2.5 px-5 disabled:opacity-50"
            >
              Run analysis
            </button>

            <button
              type="button"
              onClick={() => resetRun()}
              disabled={!runId}
              className="btn-secondary text-sm py-2.5 px-5 disabled:opacity-50"
            >
              Reset run
            </button>
          </div>
        </div>

        <div className="mb-8 border-b border-edge">
          <div className="flex gap-6 -mb-px flex-wrap">
            <button
              type="button"
              onClick={() => setCurrentTab("workflow")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                currentTab === "workflow"
                  ? "border-primary text-primary-dark"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              SaaS optimization agent
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab("causal")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-2 ${
                currentTab === "causal"
                  ? "border-primary text-primary-dark"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              Causal analysis
              {(status.graph_context as { root_cause?: string } | undefined)?.root_cause ? (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    currentTab === "causal"
                      ? "bg-primary-light text-primary-dark"
                      : "bg-gray-100 text-muted"
                  }`}
                >
                  KG
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab("digital_twin")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-2 ${
                currentTab === "digital_twin"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              Digital twin simulations
              {status.simulation_results && status.simulation_results.length > 0 ? (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    currentTab === "digital_twin"
                      ? "bg-accent-light text-accent"
                      : "bg-gray-100 text-muted"
                  }`}
                >
                  {status.simulation_results.length}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {currentTab === "causal" ? (
          <div className="animate-in fade-in duration-300">
            <CausalAnalysisPanel
              recommendations={recommendations}
              graphContext={(status.graph_context as GraphContextPayload) || null}
              graphAlerts={(status.graph_alerts as Array<Record<string, unknown>>) || []}
            />
          </div>
        ) : currentTab === "workflow" ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <AgentWorkflow
              lastEvent={lastEvent}
              completedNodes={completedNodes}
              activeNode={activeNode}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <DetectedServicesPanel services={services} />
              <DuplicateDetectionPanel candidates={duplicateCandidates} />
            </div>

            <div className="flex flex-col gap-4">
              <RecommendationsPanel
                recommendations={recommendations}
                needsHumanApproval={needsHumanApproval}
                disabled={approveBusy}
              />

              {needsHumanApproval ? (
                <div className="rounded-md border border-warning/40 bg-warning-light p-5">
                  <div className="text-sm font-semibold text-ink">Human approval required</div>
                  <div className="text-xs text-muted mt-1">
                    Run-level approval applies to all recommendations in this execution.
                  </div>
                  <label className="block mt-3 text-xs text-ink font-medium">
                    Operator notes (optional)
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="mt-2 w-full rounded-md bg-white border border-edge p-3 text-sm text-ink placeholder:text-muted/60"
                      placeholder="e.g. Approved for execution during change window"
                    />
                  </label>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => onApprove("approved")}
                      disabled={approveBusy}
                      className="btn-primary text-sm py-2 px-5 disabled:opacity-50"
                    >
                      Approve all
                    </button>
                    <button
                      type="button"
                      onClick={() => onApprove("rejected")}
                      disabled={approveBusy}
                      className="rounded-md border border-danger/40 bg-white text-danger font-semibold text-sm py-2 px-5 hover:bg-danger-light/50 disabled:opacity-50"
                    >
                      Reject all
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <p className="text-xs text-muted rounded-md border border-edge bg-gray-50/80 px-4 py-3">
              Quantifiable impact (execution logs, predicted vs actual, ROI, efficiency) is on{" "}
              <Link to="/dashboard" className="font-semibold text-primary underline-offset-2 hover:underline">
                Command Center
              </Link>{" "}
              — same run, shared state.
            </p>
          </div>
        ) : currentTab === "digital_twin" ? (
          <div className="animate-in fade-in duration-300">
            <DigitalTwinPage results={status.simulation_results || []} />
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
