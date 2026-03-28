"""
GraphBuilderAgent — constructs a NetworkX graph and stores JSON snapshot in state['knowledge_graph'].
"""
from __future__ import annotations

import networkx as nx

from graph.state import AgentState
from services.knowledge_graph_core import graph_to_dict, make_node_id
from utils.logging_utils import get_logger

LOGGER_NAME = "kg_graph_builder"


class GraphBuilderAgent:
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ GraphBuilderAgent started")

        G = nx.MultiDiGraph()
        entities = state.get("extracted_entities", [])

        for e in entities:
            et = e.get("type")
            if et == "service_usage":
                svc = e.get("service", "Unknown")
                team = e.get("team", "Engineering")
                sid = make_node_id("service", svc)
                tid = make_node_id("team", team)
                G.add_node(sid, kind="service", label=svc, category=e.get("category", "Other"))
                G.add_node(tid, kind="team", label=team)
                cid = make_node_id("cost", f"{svc}_monthly")
                G.add_node(cid, kind="cost", label=f"{svc} monthly", amount=float(e.get("monthly_cost", 0)))
                um = make_node_id("um", f"{svc}_util")
                G.add_node(
                    um,
                    kind="usage_metric",
                    label=f"{svc} utilisation",
                    utilisation_score=float(e.get("utilisation_score", 1.0)),
                    seats=int(e.get("seat_count", 0)),
                )
            elif et == "service":
                name = e.get("name") or "Unknown"
                sid = make_node_id("service", name)
                G.add_node(sid, kind="service", label=name)
            elif et == "team":
                name = e.get("name") or "Unknown"
                tid = make_node_id("team", name)
                G.add_node(tid, kind="team", label=name)

        # Ensure graph is non-empty for downstream
        if G.number_of_nodes() == 0:
            G.add_node(make_node_id("service", "placeholder"), kind="service", label="NoData")

        payload = graph_to_dict(G)
        log.info(f"▶ GraphBuilderAgent complete — nodes={payload['meta']['node_count']}")
        return {"knowledge_graph": payload}
