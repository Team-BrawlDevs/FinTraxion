"""
CausalityAgent — graph traversal + usage/cost correlation for root-cause hypotheses.
Triggers alerts on anomaly patterns (e.g. low utilisation vs billed seats).
Optional LLM reasoning is skipped by default for latency; heuristics are always on.
"""
from __future__ import annotations

from graph.state import AgentState
from services.knowledge_graph_core import (
    MAX_TRAVERSAL_DEPTH,
    dict_to_graph,
    find_service_nodes,
    successors_within_depth,
)
from utils.logging_utils import get_logger

LOGGER_NAME = "kg_causality"


def _mean_util(usage_data: list[dict]) -> float:
    vals = [float(u.get("utilisation_score", 1.0) or 1.0) for u in usage_data]
    return sum(vals) / max(len(vals), 1)


class CausalityAgent:
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ CausalityAgent started")

        G = dict_to_graph(state.get("knowledge_graph"))
        usage_data = state.get("usage_data", [])
        alerts: list[dict] = []
        insights: list[dict] = []

        portfolio_util = _mean_util(usage_data)

        for u in usage_data:
            name = u.get("canonical_name") or "Unknown"
            cost = float(u.get("monthly_cost", 0) or 0)
            util = float(u.get("utilisation_score", 1.0) or 1.0)
            seats = int(u.get("seat_count", 0) or 0)
            idle_days = int(u.get("last_used_days_ago", 0) or 0)

            if cost > 5000 and util < 0.45:
                msg = (
                    f"{name} cost is elevated (${cost:,.0f}/mo) while utilisation is low "
                    f"({util:.0%}); likely inactive or oversized licensing."
                )
                alerts.append({"type": "cost_spike", "service": name, "detail": msg, "severity": "high"})
                insights.append(
                    {
                        "service": name,
                        "statement": msg,
                        "severity": "high",
                    }
                )
            elif seats > 25 and util < 0.5:
                msg = f"{name} maintains {seats} seats at {util:.0%} utilisation — billing may include unused seats."
                alerts.append({"type": "inactive_licensing", "service": name, "detail": msg, "severity": "medium"})
                insights.append({"service": name, "statement": msg, "severity": "medium"})
            elif idle_days > 60 and cost > 1000:
                msg = f"{name} shows no recent usage ({idle_days}d) with ongoing cost ${cost:,.0f}/mo."
                insights.append({"service": name, "statement": msg, "severity": "medium"})

        if portfolio_util < 0.55 and usage_data:
            alerts.append(
                {
                    "type": "portfolio_underutilization",
                    "detail": f"Portfolio mean utilisation {portfolio_util:.0%} suggests systemic waste.",
                    "severity": "medium",
                }
            )

        # Graph traversal: relate services through overlap / dependency
        root_fragments: list[str] = []
        for svc_id in find_service_nodes(G)[:8]:
            dist = successors_within_depth(G, svc_id, max_depth=min(3, MAX_TRAVERSAL_DEPTH))
            if len(dist) > 3:
                label = G.nodes[svc_id].get("label", svc_id)
                root_fragments.append(
                    f"{label} sits in a dependency/overlap neighborhood of {len(dist)-1} related entities"
                )

        if not root_fragments and insights:
            root_fragments = [i["statement"] for i in insights[:2]]
        elif not root_fragments:
            root_fragments = ["No strong causal pattern detected from current graph and usage signals."]

        root_cause = " ".join(root_fragments[:3])

        log.info(f"▶ CausalityAgent complete — {len(alerts)} alerts, {len(insights)} insights")
        cm = dict(state.get("context_memory") or {})
        cm["causal_root_hypothesis"] = root_cause
        cm["causal_insights_staging"] = insights
        return {
            "graph_alerts": alerts,
            "context_memory": cm,
        }
