"""
NetworkX-backed enterprise knowledge graph: serialization, merge, bounded traversal.
Used by GraphBuilder, Relationship, Causality, and Simulation integration.
"""
from __future__ import annotations

import hashlib
import json
from typing import Any

import networkx as nx

# Hard cap for traversal depth (performance)
MAX_TRAVERSAL_DEPTH = 4


def make_node_id(kind: str, label: str) -> str:
    h = hashlib.sha256(f"{kind}:{label}".encode()).hexdigest()[:12]
    return f"{kind}_{h}"


def empty_graph_dict() -> dict[str, Any]:
    """JSON-serializable empty graph snapshot."""
    return {
        "version": 1,
        "nodes": [],
        "edges": [],
        "meta": {"node_count": 0, "edge_count": 0},
    }


def graph_to_dict(G: nx.MultiDiGraph) -> dict[str, Any]:
    """Serialize MultiDiGraph to a plain dict (nodes/edges lists)."""
    nodes: list[dict[str, Any]] = []
    for nid, data in G.nodes(data=True):
        nodes.append({"id": nid, **data})

    edges: list[dict[str, Any]] = []
    for u, v, key, data in G.edges(keys=True, data=True):
        edges.append({"source": u, "target": v, "key": key, **data})

    return {
        "version": 1,
        "nodes": nodes,
        "edges": edges,
        "meta": {"node_count": G.number_of_nodes(), "edge_count": G.number_of_edges()},
    }


def dict_to_graph(payload: dict[str, Any] | None) -> nx.MultiDiGraph:
    """Deserialize from graph_to_dict output."""
    G = nx.MultiDiGraph()
    if not payload:
        return G
    for n in payload.get("nodes") or []:
        nid = n.get("id")
        if not nid:
            continue
        attrs = {k: v for k, v in n.items() if k != "id"}
        G.add_node(nid, **attrs)
    for e in payload.get("edges") or []:
        u, v = e.get("source"), e.get("target")
        if not u or not v:
            continue
        key = e.get("key", 0)
        attrs = {k: v for k, v in e.items() if k not in ("source", "target", "key")}
        G.add_edge(u, v, key=key, **attrs)
    return G


def merge_graph_dict(base: dict[str, Any], delta: dict[str, Any]) -> dict[str, Any]:
    """Incremental merge: union nodes and edges (by id / source+target+type+key)."""
    out = dict(base) if base else empty_graph_dict()
    seen_nodes = {n["id"] for n in out.get("nodes", []) if n.get("id")}
    for n in delta.get("nodes") or []:
        nid = n.get("id")
        if nid and nid not in seen_nodes:
            out.setdefault("nodes", []).append(n)
            seen_nodes.add(nid)

    seen_e = set()
    for e in out.get("edges", []):
        seen_e.add(
            (e.get("source"), e.get("target"), e.get("key"), e.get("relation"))
        )
    for e in delta.get("edges") or []:
        sig = (e.get("source"), e.get("target"), e.get("key"), e.get("relation"))
        if sig not in seen_e:
            out.setdefault("edges", []).append(e)
            seen_e.add(sig)

    out["meta"] = {
        "node_count": len(out.get("nodes", [])),
        "edge_count": len(out.get("edges", [])),
    }
    return out


def successors_within_depth(
    G: nx.MultiDiGraph,
    start: str,
    max_depth: int = MAX_TRAVERSAL_DEPTH,
) -> dict[str, int]:
    """BFS distance from start to successors (undirected expansion for context)."""
    if start not in G:
        return {}
    dist: dict[str, int] = {start: 0}
    frontier = [start]
    while frontier:
        cur = frontier.pop(0)
        d = dist[cur]
        if d >= max_depth:
            continue
        for nb in list(G.successors(cur)) + list(G.predecessors(cur)):
            if nb not in dist:
                dist[nb] = d + 1
                frontier.append(nb)
    return dist


def find_service_nodes(G: nx.MultiDiGraph) -> list[str]:
    return [n for n, d in G.nodes(data=True) if d.get("kind") == "service"]


def summarize_graph(payload: dict[str, Any] | None) -> dict[str, Any]:
    if not payload:
        return {"node_count": 0, "edge_count": 0}
    meta = payload.get("meta") or {}
    return {
        "node_count": meta.get("node_count", len(payload.get("nodes", []))),
        "edge_count": meta.get("edge_count", len(payload.get("edges", []))),
    }


def cache_key_for_graph(payload: dict[str, Any]) -> str:
    """Stable hash for optional caching."""
    raw = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]
