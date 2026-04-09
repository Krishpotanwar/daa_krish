"""
Dijkstra's Algorithm + Bellman-Ford — Python Implementation
DAA Unit III: Single-Source Shortest Path

Vercel Python Serverless Function.
Called by PureWay frontend to compute the cleanest AQI-weighted route
on a named-node graph of city locations.

Time: Dijkstra O((V+E) log V), Bellman-Ford O(V*E)
Space: O(V)
"""

import heapq
import json
import math
from http.server import BaseHTTPRequestHandler


# ---------------------------------------------------------------------------
# Delhi AQI-weighted graph (hardcoded for demo, Unit III)
# Edge weight = distance_km + AQI_penalty/100
# ---------------------------------------------------------------------------
DELHI_GRAPH = {
    "Connaught Place": [("India Gate", 3.1), ("Karol Bagh", 4.2), ("Rajiv Chowk", 1.5)],
    "India Gate":      [("Connaught Place", 3.1), ("Lodhi Colony", 2.4), ("Pragati Maidan", 2.0)],
    "Karol Bagh":      [("Connaught Place", 4.2), ("Rajiv Chowk", 3.8), ("Patel Nagar", 2.6)],
    "Rajiv Chowk":     [("Connaught Place", 1.5), ("Karol Bagh", 3.8), ("India Gate", 3.5)],
    "Lodhi Colony":    [("India Gate", 2.4), ("Pragati Maidan", 3.1), ("Patel Nagar", 5.0)],
    "Pragati Maidan":  [("India Gate", 2.0), ("Lodhi Colony", 3.1)],
    "Patel Nagar":     [("Karol Bagh", 2.6), ("Lodhi Colony", 5.0)],
}

NODE_COORDS = {
    "Connaught Place": (28.6315, 77.2167),
    "Rajiv Chowk":     (28.6328, 77.2197),
    "India Gate":      (28.6129, 77.2295),
    "Karol Bagh":      (28.6517, 77.1902),
    "Lodhi Colony":    (28.5921, 77.2238),
    "Pragati Maidan":  (28.6133, 77.2429),
    "Patel Nagar":     (28.6531, 77.1726),
}


def dijkstra(graph: dict, source: str) -> tuple[dict, dict]:
    """
    Dijkstra's single-source shortest path using a min-heap.
    Returns (distances, predecessors) for all nodes.
    """
    distances = {node: float('inf') for node in graph}
    predecessors = {node: None for node in graph}
    distances[source] = 0

    pq = [(0, source)]  # (cost, node)
    visited = set()

    while pq:
        cost, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)

        for v, weight in graph.get(u, []):
            new_cost = cost + weight
            if new_cost < distances[v]:
                distances[v] = new_cost
                predecessors[v] = u
                heapq.heappush(pq, (new_cost, v))

    return distances, predecessors


def bellman_ford(graph: dict, source: str) -> tuple[dict, dict] | None:
    """
    Bellman-Ford — handles negative weights, detects negative cycles.
    Returns (distances, predecessors) or None if negative cycle detected.
    """
    nodes = list(graph.keys())
    distances = {n: float('inf') for n in nodes}
    predecessors = {n: None for n in nodes}
    distances[source] = 0

    # Build flat edge list
    edges = []
    for u, neighbors in graph.items():
        for v, w in neighbors:
            edges.append((u, v, w))

    # Relax |V| - 1 times
    for _ in range(len(nodes) - 1):
        for u, v, w in edges:
            if distances[u] != float('inf') and distances[u] + w < distances[v]:
                distances[v] = distances[u] + w
                predecessors[v] = u

    # Check for negative-weight cycles
    for u, v, w in edges:
        if distances[u] != float('inf') and distances[u] + w < distances[v]:
            return None  # Negative cycle

    return distances, predecessors


def reconstruct_path(predecessors: dict, destination: str) -> list[str]:
    path = []
    current = destination
    while current is not None:
        path.insert(0, current)
        current = predecessors.get(current)
    return path


def add_cors(handler_instance):
    handler_instance.send_header('Access-Control-Allow-Origin', '*')
    handler_instance.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    handler_instance.send_header('Access-Control-Allow-Headers', 'Content-Type')


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        add_cors(self)
        self.end_headers()

    def do_GET(self):
        self._run("Connaught Place", "India Gate")

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length)) if length else {}
        source = body.get('source', 'Connaught Place')
        destination = body.get('destination', 'India Gate')
        self._run(source, destination)

    def _run(self, source: str, destination: str):
        if source not in DELHI_GRAPH:
            source = 'Connaught Place'
        if destination not in DELHI_GRAPH:
            destination = 'India Gate'

        # Run Dijkstra
        dists, preds = dijkstra(DELHI_GRAPH, source)
        path = reconstruct_path(preds, destination)
        distance = dists[destination]

        # Run Bellman-Ford for comparison
        bf_result = bellman_ford(DELHI_GRAPH, source)
        bf_distance = bf_result[0][destination] if bf_result else None

        # Build coordinate list for map rendering
        coords = [
            {"lat": NODE_COORDS[n][0], "lon": NODE_COORDS[n][1], "name": n}
            for n in path if n in NODE_COORDS
        ]

        result = {
            "algorithm": "Dijkstra's Algorithm (AQI-weighted)",
            "unit": "Unit III",
            "complexity": "O((V + E) log V)",
            "source": source,
            "destination": destination,
            "path": path,
            "distance": round(distance, 2),
            "bellman_ford_distance": round(bf_distance, 2) if bf_distance is not None else None,
            "coordinates": coords,
            "graph_nodes": list(DELHI_GRAPH.keys()),
        }

        body = json.dumps(result).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        add_cors(self)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass  # Suppress default request logging
