"""Unit tests for NetworkX graph serialization and helpers."""
from __future__ import annotations

import networkx as nx

from services import knowledge_graph_core as kgc


def test_graph_roundtrip():
    G = nx.MultiDiGraph()
    G.add_node("s1", kind="service", label="Slack")
    G.add_node("t1", kind="team", label="Eng")
    G.add_edge("t1", "s1", relation="uses", key=0)
    d = kgc.graph_to_dict(G)
    H = kgc.dict_to_graph(d)
    assert H.number_of_nodes() == G.number_of_nodes()
    assert H.nodes["s1"]["label"] == "Slack"


def test_merge_and_summarize():
    a = kgc.empty_graph_dict()
    b = {
        "version": 1,
        "nodes": [{"id": "n1", "kind": "service", "label": "X"}],
        "edges": [],
        "meta": {},
    }
    m = kgc.merge_graph_dict(a, b)
    assert m["meta"]["node_count"] >= 1
    s = kgc.summarize_graph(m)
    assert "node_count" in s


def test_successors_within_depth():
    G = nx.MultiDiGraph()
    for i in range(4):
        G.add_node(f"n{i}", kind="test")
    for i in range(3):
        G.add_edge(f"n{i}", f"n{i+1}", relation="depends_on", key=0)
    dist = kgc.successors_within_depth(G, "n0", max_depth=2)
    assert len(dist) >= 3
