"""
RelationshipAgent — adds typed edges (uses, owns, depends_on, contributes_to_cost, overlaps_with).
"""
from __future__ import annotations

import networkx as nx

from graph.state import AgentState
from services.knowledge_graph_core import dict_to_graph, graph_to_dict, make_node_id
from utils.logging_utils import get_logger

LOGGER_NAME = "kg_relationship"


class RelationshipAgent:
    def __call__(self, state: AgentState) -> dict:
        log = get_logger(LOGGER_NAME, state["run_id"])
        log.info("▶ RelationshipAgent started")

        base = state.get("knowledge_graph") or {}
        G = dict_to_graph(base)

        entities = state.get("extracted_entities", [])

        for e in entities:
            et = e.get("type")
            if et == "service_usage":
                svc = e.get("service", "Unknown")
                team = e.get("team", "Engineering")
                sid = make_node_id("service", svc)
                tid = make_node_id("team", team)
                cid = make_node_id("cost", f"{svc}_monthly")
                um = make_node_id("um", f"{svc}_util")
                if sid in G and tid in G:
                    G.add_edge(tid, sid, relation="uses", key=0)
                if sid in G and cid in G:
                    G.add_edge(sid, cid, relation="contributes_to_cost", key=0)
                if sid in G and um in G:
                    G.add_edge(um, sid, relation="correlates_with", key=0)
            elif et == "duplicate_pair":
                a, b = e.get("service_a"), e.get("service_b")
                if not a or not b:
                    continue
                sa, sb = make_node_id("service", a), make_node_id("service", b)
                if sa in G and sb in G:
                    G.add_edge(sa, sb, relation="overlaps_with", key=0)
                    G.add_edge(sb, sa, relation="overlaps_with", key=1)

        # Heuristic depends_on: same category creates soft dependency chain
        services = [(n, d) for n, d in G.nodes(data=True) if d.get("kind") == "service"]
        by_cat: dict[str, list[str]] = {}
        for nid, data in services:
            cat = data.get("category") or "Other"
            by_cat.setdefault(cat, []).append(nid)
        for cat, nids in by_cat.items():
            if cat == "Other" or len(nids) < 2:
                continue
            for i in range(len(nids) - 1):
                G.add_edge(nids[i], nids[i + 1], relation="depends_on", key=0)

        out = graph_to_dict(G)
        log.info(f"▶ RelationshipAgent complete — edges={out['meta']['edge_count']}")
        return {"knowledge_graph": out}
