"""
ContextAgent — packages graph + causality into state['graph_context'] for DecisionAgent
and audit surfaces (root_cause, affected_services, risk_factors, per-recommendation hints).
Persists a JSON snapshot to Supabase memory for durability.
"""
from __future__ import annotations

import json

from db.supabase_client import memory_set
from graph.state import AgentState
from services.knowledge_graph_core import dict_to_graph, summarize_graph
from utils.logging_utils import get_logger

LOGGER_NAME = "kg_context"


class ContextAgent:
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ ContextAgent started")

        kg = state.get("knowledge_graph") or {}
        summary = summarize_graph(kg)
        G = dict_to_graph(kg)

        staging = (state.get("context_memory") or {}).get("causal_insights_staging") or []
        alerts = state.get("graph_alerts") or []

        affected = []
        for ins in staging:
            s = ins.get("service")
            if s and s not in affected:
                affected.append(s)

        risk_factors: list[str] = []
        for a in alerts:
            risk_factors.append(a.get("detail") or json.dumps(a, default=str))
        for ins in staging:
            if ins.get("severity") == "high":
                risk_factors.append(ins.get("statement", ""))

        root = (state.get("context_memory") or {}).get("causal_root_hypothesis") or ""
        if not root and staging:
            root = staging[0].get("statement", "")

        per_hints: list[dict] = []
        for ins in staging:
            per_hints.append(
                {
                    "service": ins.get("service"),
                    "reason": ins.get("statement"),
                    "source": "Graph analysis",
                    "severity": ins.get("severity", "low"),
                }
            )

        graph_context = {
            "root_cause": root,
            "affected_services": affected[:20],
            "risk_factors": risk_factors[:15],
            "causal_insights": staging,
            "per_recommendation_hints": per_hints,
            "graph_summary": summary,
            "graph_node_sample": [G.nodes[n].get("label", n) for n in list(G.nodes)[:12]],
        }

        run_id = state["run_id"]
        try:
            memory_set(f"run:{run_id}:knowledge_graph", kg)
            memory_set(f"run:{run_id}:graph_context", graph_context)
        except Exception as exc:
            log.warning(f"Supabase graph snapshot skipped: {exc}")

        log.info("▶ ContextAgent complete — graph_context ready for DecisionAgent")
        return {"graph_context": graph_context}
