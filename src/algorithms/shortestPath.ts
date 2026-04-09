/**
 * Shortest Path Algorithms: Dijkstra & Bellman-Ford
 *
 * DAA Concept (Unit III — Greedy & Dynamic Programming on Graphs):
 * Dijkstra's algorithm uses a greedy min-priority-queue to find the
 * shortest path from a single source to all other nodes in O((V+E) log V).
 * Bellman-Ford relaxes all edges V-1 times, allowing negative-weight edges,
 * running in O(VE).
 *
 * Real-world use in PureWay:
 * Given any two GPS coordinates on Earth, PureWay samples real-time AQI
 * data along the route, builds a dynamic weighted graph, and runs Dijkstra
 * to find the path that minimises total pollution exposure.
 * Works for any city/location — not hardcoded to any region.
 */

export const DIJKSTRA_COMPLEXITY = 'O((V + E) log V)';
export const DIJKSTRA_SPACE = 'O(V)';
export const BELLMAN_FORD_COMPLEXITY = 'O(V · E)';
export const BELLMAN_FORD_SPACE = 'O(V)';

// ---------------------------------------------------------------------------
// Graph types
// ---------------------------------------------------------------------------

export interface Edge {
  to: string;
  /** Combined weight = distance_km + AQI_penalty */
  weight: number;
}

export interface Graph {
  [node: string]: Edge[];
}

export interface ShortestPathResult {
  distances: { [node: string]: number };
  predecessors: { [node: string]: string | null };
}

// ---------------------------------------------------------------------------
// Delhi AQI-weighted graph (6 representative locations)
//
// Weight formula: distance_km + (avg_AQI_along_segment / 100)
// Higher AQI → higher penalty → Dijkstra avoids polluted corridors
// ---------------------------------------------------------------------------

export const DELHI_GRAPH: Graph = {
  'Connaught Place': [
    { to: 'India Gate',        weight: 3.1 },   // ~2.5 km, moderate AQI corridor
    { to: 'Karol Bagh',        weight: 4.2 },
    { to: 'Rajiv Chowk',       weight: 1.5 },
  ],
  'India Gate': [
    { to: 'Connaught Place',   weight: 3.1 },
    { to: 'Lodhi Colony',      weight: 2.4 },
    { to: 'Pragati Maidan',    weight: 2.0 },
  ],
  'Karol Bagh': [
    { to: 'Connaught Place',   weight: 4.2 },
    { to: 'Rajiv Chowk',       weight: 3.8 },
    { to: 'Patel Nagar',       weight: 2.6 },
  ],
  'Rajiv Chowk': [
    { to: 'Connaught Place',   weight: 1.5 },
    { to: 'Karol Bagh',        weight: 3.8 },
    { to: 'India Gate',        weight: 3.5 },
  ],
  'Lodhi Colony': [
    { to: 'India Gate',        weight: 2.4 },
    { to: 'Pragati Maidan',    weight: 3.1 },
    { to: 'Patel Nagar',       weight: 5.0 },
  ],
  'Pragati Maidan': [
    { to: 'India Gate',        weight: 2.0 },
    { to: 'Lodhi Colony',      weight: 3.1 },
  ],
  'Patel Nagar': [
    { to: 'Karol Bagh',        weight: 2.6 },
    { to: 'Lodhi Colony',      weight: 5.0 },
  ],
};

// ---------------------------------------------------------------------------
// Min-heap (priority queue) for Dijkstra
// ---------------------------------------------------------------------------

class MinHeap {
  private heap: { node: string; dist: number }[] = [];

  push(node: string, dist: number) {
    this.heap.push({ node, dist });
    this._bubbleUp(this.heap.length - 1);
  }

  pop(): { node: string; dist: number } | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  get size() {
    return this.heap.length;
  }

  private _bubbleUp(i: number) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].dist <= this.heap[i].dist) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private _sinkDown(i: number) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l].dist < this.heap[smallest].dist) smallest = l;
      if (r < n && this.heap[r].dist < this.heap[smallest].dist) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

// ---------------------------------------------------------------------------
// Dijkstra's Algorithm
// ---------------------------------------------------------------------------

/**
 * Runs Dijkstra's single-source shortest-path algorithm.
 *
 * @param graph  Adjacency list with AQI-weighted edges
 * @param source Starting node (e.g. 'Connaught Place')
 * @returns distances and predecessors for every reachable node
 */
export function dijkstra(graph: Graph, source: string): ShortestPathResult {
  const distances: { [node: string]: number } = {};
  const predecessors: { [node: string]: string | null } = {};
  const visited = new Set<string>();

  // Initialise all nodes to Infinity
  for (const node of Object.keys(graph)) {
    distances[node] = Infinity;
    predecessors[node] = null;
  }
  distances[source] = 0;

  const pq = new MinHeap();
  pq.push(source, 0);

  while (pq.size > 0) {
    const { node: u, dist: d } = pq.pop()!;
    if (visited.has(u)) continue;
    visited.add(u);

    for (const { to: v, weight } of graph[u] ?? []) {
      const newDist = d + weight;
      if (newDist < distances[v]) {
        distances[v] = newDist;
        predecessors[v] = u;
        pq.push(v, newDist);
      }
    }
  }

  return { distances, predecessors };
}

// ---------------------------------------------------------------------------
// Bellman-Ford Algorithm
// ---------------------------------------------------------------------------

/**
 * Runs Bellman-Ford single-source shortest-path algorithm.
 * Slower than Dijkstra but handles negative-weight edges and detects
 * negative-weight cycles (not present in our AQI graph, but included
 * for algorithmic completeness as required by the DAA syllabus).
 *
 * @param graph  Adjacency list with AQI-weighted edges
 * @param source Starting node
 * @returns distances and predecessors (or null if a negative cycle exists)
 */
export function bellmanFord(graph: Graph, source: string): ShortestPathResult | null {
  const nodes = Object.keys(graph);
  const distances: { [node: string]: number } = {};
  const predecessors: { [node: string]: string | null } = {};

  for (const node of nodes) {
    distances[node] = Infinity;
    predecessors[node] = null;
  }
  distances[source] = 0;

  // Build flat edge list once
  const edges: { from: string; to: string; weight: number }[] = [];
  for (const from of nodes) {
    for (const { to, weight } of graph[from] ?? []) {
      edges.push({ from, to, weight });
    }
  }

  // Relax |V| - 1 times
  for (let i = 0; i < nodes.length - 1; i++) {
    for (const { from, to, weight } of edges) {
      if (distances[from] !== Infinity && distances[from] + weight < distances[to]) {
        distances[to] = distances[from] + weight;
        predecessors[to] = from;
      }
    }
  }

  // Check for negative-weight cycles
  for (const { from, to, weight } of edges) {
    if (distances[from] !== Infinity && distances[from] + weight < distances[to]) {
      return null; // Negative cycle detected
    }
  }

  return { distances, predecessors };
}

// ---------------------------------------------------------------------------
// Helper: reconstruct path from predecessors map
// ---------------------------------------------------------------------------

export function reconstructPath(predecessors: { [node: string]: string | null }, destination: string): string[] {
  const path: string[] = [];
  let current: string | null = destination;
  while (current !== null) {
    path.unshift(current);
    current = predecessors[current] ?? null;
  }
  return path;
}

// ---------------------------------------------------------------------------
// Dynamic graph builder — works for ANY location on Earth
// ---------------------------------------------------------------------------

/**
 * Haversine distance between two GPS coordinates, in kilometres.
 * Used as the base distance component of AQI-weighted edge weights.
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface GeoNode {
  id: string;
  lat: number;
  lon: number;
  /** Real-time AQI fetched from Open-Meteo for this location */
  aqi: number;
}

/**
 * Build an AQI-weighted graph from any set of geo-located nodes.
 *
 * Edge weight = haversine_distance_km + (avg_AQI_of_endpoints / 100)
 * This penalises polluted corridors regardless of city or country.
 * Nodes are connected if they are within maxConnectKm of each other.
 *
 * @param nodes       Geo-nodes with real-time AQI values
 * @param maxConnectKm  Maximum distance for two nodes to be connected
 */
export function buildGraphFromPoints(nodes: GeoNode[], maxConnectKm = 50): Graph {
  const graph: Graph = {};
  for (const node of nodes) {
    graph[node.id] = [];
  }
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dist = haversineKm(a.lat, a.lon, b.lat, b.lon);
      if (dist <= maxConnectKm) {
        const weight = dist + (a.aqi + b.aqi) / 200;
        graph[a.id].push({ to: b.id, weight });
        graph[b.id].push({ to: a.id, weight });
      }
    }
  }
  return graph;
}
