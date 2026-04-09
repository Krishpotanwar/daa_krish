from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List, Tuple, Optional
try:
    import pathfinding
except ImportError:
    from api.python import pathfinding
from fastapi.middleware.cors import CORSMiddleware
import random
import os
import heapq
import urllib.request
import urllib.parse

app = FastAPI(title="PureWay Pathfinding API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PathRequest(BaseModel):
    start: Tuple[int, int]
    end: Tuple[int, int]
    grid_size: Optional[int] = 20

class PathResponse(BaseModel):
    bfs_path: Optional[List[Tuple[int, int]]]
    dfs_path: Optional[List[Tuple[int, int]]]
    dijkstra_path: Optional[List[Tuple[int, int]]]
    a_star_path: Optional[List[Tuple[int, int]]]
    grid: List[List[int]]
    weights: List[List[int]]

def generate_mock_data(size: int, start: Tuple[int, int], end: Tuple[int, int]):
    # Create an empty grid (0 = passable)
    grid = [[0 for _ in range(size)] for _ in range(size)]
    
    # Create weights (pollution levels 0-100)
    # Higher weights make Dijkstra/A* avoid those areas
    weights = [[random.randint(5, 50) for _ in range(size)] for _ in range(size)]
    
    # Create a "dirty" corridor (High pollution)
    for i in range(size):
        weights[size // 2][i] = 100
        
    # Create a "clean" corridor (Low pollution)
    for i in range(size):
        weights[i][size // 4] = 0
        
    # Add some obstacles
    if size >= 10:
        for i in range(2, size-5):
            grid[i][size-3] = 1 # Obstacle
            
    # Ensure start and end are reachable
    grid[start[0]][start[1]] = 0
    grid[end[0]][end[1]] = 0
    weights[start[0]][start[1]] = 0
    weights[end[0]][end[1]] = 0
    
    return grid, weights

@app.get("/")
def read_root():
    return {"message": "Welcome to BreatheWay Pathfinding API", "algorithms": ["BFS", "DFS", "Dijkstra", "A*"]}

@app.post("/find-path", response_model=PathResponse)
def find_path(request: PathRequest):
    grid, weights = generate_mock_data(request.grid_size, request.start, request.end)
    
    bfs_res = pathfinding.bfs(grid, request.start, request.end)
    dfs_res = pathfinding.dfs(grid, request.start, request.end)
    dijkstra_res = pathfinding.dijkstra(grid, weights, request.start, request.end)
    a_star_res = pathfinding.a_star(grid, weights, request.start, request.end)
    
    return {
        "bfs_path": bfs_res,
        "dfs_path": dfs_res,
        "dijkstra_path": dijkstra_res,
        "a_star_path": a_star_res,
        "grid": grid,
        "weights": weights
    }

# ===========================================================================
# DAA Lab Algorithms — Unit II, III, IV
# Imported from the Vercel serverless functions for shared logic
# ===========================================================================

import heapq
import math as _math
from typing import Optional as _Opt

# ── Unit III: Dijkstra + Bellman-Ford ───────────────────────────────────────

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


def _dijkstra(graph: dict, source: str) -> tuple:
    distances = {n: float('inf') for n in graph}
    predecessors = {n: None for n in graph}
    distances[source] = 0
    pq = [(0, source)]
    visited = set()
    while pq:
        cost, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)
        for v, w in graph.get(u, []):
            if cost + w < distances[v]:
                distances[v] = cost + w
                predecessors[v] = u
                heapq.heappush(pq, (cost + w, v))
    return distances, predecessors


def _bellman_ford(graph: dict, source: str) -> _Opt[tuple]:
    nodes = list(graph.keys())
    dist = {n: float('inf') for n in nodes}
    pred = {n: None for n in nodes}
    dist[source] = 0
    edges = [(u, v, w) for u, vs in graph.items() for v, w in vs]
    for _ in range(len(nodes) - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                pred[v] = u
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            return None
    return dist, pred


def _reconstruct(pred: dict, dest: str) -> list:
    path, cur = [], dest
    while cur:
        path.insert(0, cur)
        cur = pred.get(cur)
    return path


class DijkstraRequest(BaseModel):
    source: str = "Connaught Place"
    destination: str = "India Gate"


@app.post("/dijkstra")
@app.get("/dijkstra")
def run_dijkstra(request: _Opt[DijkstraRequest] = None):
    """Unit III — Dijkstra's Algorithm on AQI-weighted Delhi city graph"""
    src = (request.source if request else "Connaught Place") or "Connaught Place"
    dst = (request.destination if request else "India Gate") or "India Gate"
    if src not in DELHI_GRAPH: src = "Connaught Place"
    if dst not in DELHI_GRAPH: dst = "India Gate"

    dists, preds = _dijkstra(DELHI_GRAPH, src)
    path = _reconstruct(preds, dst)
    bf = _bellman_ford(DELHI_GRAPH, src)

    return {
        "algorithm": "Dijkstra's Algorithm (AQI-weighted)",
        "unit": "Unit III",
        "complexity": "O((V + E) log V)",
        "source": src, "destination": dst,
        "path": path,
        "distance": round(dists[dst], 2),
        "bellman_ford_distance": round(bf[0][dst], 2) if bf else None,
        "coordinates": [
            {"lat": NODE_COORDS[n][0], "lon": NODE_COORDS[n][1], "name": n}
            for n in path if n in NODE_COORDS
        ],
    }


# ── Unit II: Greedy Activity Selection ──────────────────────────────────────

SAMPLE_SEGMENTS = [
    {"id": "s1", "start": 0.0, "end": 0.4, "aqi_cost": 42,  "label": "Connaught Place → Rajpath"},
    {"id": "s2", "start": 0.2, "end": 0.6, "aqi_cost": 78,  "label": "Ring Road (high traffic)"},
    {"id": "s3", "start": 0.4, "end": 0.7, "aqi_cost": 35,  "label": "Lodhi Garden corridor"},
    {"id": "s4", "start": 0.6, "end": 0.9, "aqi_cost": 55,  "label": "India Gate approach"},
    {"id": "s5", "start": 0.7, "end": 1.0, "aqi_cost": 48,  "label": "Kartavya Path (tree-lined)"},
    {"id": "s6", "start": 0.0, "end": 0.3, "aqi_cost": 90,  "label": "Flyover (diesel exhaust)"},
    {"id": "s7", "start": 0.3, "end": 0.65,"aqi_cost": 30,  "label": "Safdarjung bypass (clean)"},
]


class GreedyRequest(BaseModel):
    segments: Optional[List[dict]] = None


@app.post("/greedy")
@app.get("/greedy")
def run_greedy(request: _Opt[GreedyRequest] = None):
    """Unit II — Greedy Activity Selection on road segments"""
    segs = (request.segments if request and request.segments else None) or SAMPLE_SEGMENTS
    sorted_segs = sorted(segs, key=lambda s: s["end"])
    selected, last_end = [], float('-inf')
    for seg in sorted_segs:
        if seg["start"] >= last_end:
            selected.append(seg)
            last_end = seg["end"]
    total_aqi = sum(s["aqi_cost"] for s in selected)
    route_len = max(s["end"] for s in segs)
    covered = sum(s["end"] - s["start"] for s in selected)
    return {
        "algorithm": "Greedy Activity Selection",
        "unit": "Unit II",
        "complexity": "O(n log n)",
        "selected": selected,
        "total_aqi": total_aqi,
        "coverage_ratio": round(covered / route_len, 3) if route_len else 0,
        "rejected": [s for s in sorted_segs if s not in selected],
    }


# ── Unit IV: Closest Pair of Points ─────────────────────────────────────────

DELHI_STATIONS = [
    {"name": "Anand Vihar CPCB", "lat": 28.6469, "lon": 77.3153, "aqi": 185},
    {"name": "RK Puram CPCB",    "lat": 28.5627, "lon": 77.1853, "aqi": 142},
    {"name": "ITO CPCB",         "lat": 28.6317, "lon": 77.2490, "aqi": 158},
    {"name": "Lodhi Road CPCB",  "lat": 28.5921, "lon": 77.2238, "aqi": 98 },
    {"name": "Punjabi Bagh",     "lat": 28.6741, "lon": 77.1313, "aqi": 210},
    {"name": "Mandir Marg",      "lat": 28.6394, "lon": 77.1986, "aqi": 120},
]


def _pt_dist(a, b):
    return _math.sqrt((a["lon"]-b["lon"])**2 + (a["lat"]-b["lat"])**2)


def _strip_closest(strip, delta):
    s = sorted(strip, key=lambda p: p["lat"])
    best, pa, pb = float('inf'), None, None
    for i in range(len(s)):
        j = i + 1
        while j < len(s) and s[j]["lat"] - s[i]["lat"] < delta:
            d = _pt_dist(s[i], s[j])
            if d < best:
                best, pa, pb = d, s[i], s[j]
            j += 1
    return (pa, pb, best) if pa else None


def _cp_rec(pts):
    if len(pts) <= 3:
        best, pa, pb = float('inf'), pts[0], pts[1]
        for i in range(len(pts)):
            for j in range(i+1, len(pts)):
                d = _pt_dist(pts[i], pts[j])
                if d < best:
                    best, pa, pb = d, pts[i], pts[j]
        return pa, pb, best
    mid = len(pts)//2
    mid_pt = pts[mid]
    la, lb, ld = _cp_rec(pts[:mid])
    ra, rb, rd = _cp_rec(pts[mid:])
    pa, pb, delta = (la, lb, ld) if ld <= rd else (ra, rb, rd)
    strip = [p for p in pts if abs(p["lon"] - mid_pt["lon"]) < delta]
    sr = _strip_closest(strip, delta)
    if sr and sr[2] < delta:
        return sr
    return pa, pb, delta


def _closest_pair(points):
    if len(points) < 2:
        raise ValueError("Need ≥ 2 points")
    return _cp_rec(sorted(points, key=lambda p: p["lon"]))


class ClosestPairRequest(BaseModel):
    lat: float = 28.6315
    lon: float = 77.2167
    stations: Optional[List[dict]] = None


@app.post("/closest-pair")
@app.get("/closest-pair")
def run_closest_pair(request: _Opt[ClosestPairRequest] = None):
    """Unit IV — Closest Pair of Points (Divide & Conquer)"""
    stations = (request.stations if request and request.stations else None) or DELHI_STATIONS
    query_lat = request.lat if request else 28.6315
    query_lon = request.lon if request else 77.2167

    pa, pb, pair_dist = _closest_pair(stations)
    query = {"lat": query_lat, "lon": query_lon}
    nearest = min(stations, key=lambda s: _pt_dist(query, s))

    return {
        "algorithm": "Closest Pair of Points (Divide & Conquer)",
        "unit": "Unit IV",
        "complexity": "O(n log² n)",
        "query": query,
        "nearest_station": nearest,
        "closest_pair_demo": {
            "station_a": pa.get("name"), "station_b": pb.get("name"),
            "distance": round(pair_dist, 6),
        },
        "all_stations": stations,
    }


# ===========================================================================
# NEW: /routes and /pollution — Python-first API (TomTom + WAQI)
# These mirror the Vercel serverless functions in /api/routes.py and
# /api/pollution.py so local FastAPI dev works identically to production.
# ===========================================================================

import json as _json
_TOMTOM_KEY = os.environ.get("TOMTOM_API_KEY", "")
_WAQI_TOKEN = os.environ.get("WAQI_TOKEN", "")


def _fetch_json_local(url: str, timeout: int = 8):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return _json.loads(r.read())
    except Exception:
        return None


def _get_aqi_local(lat: float, lon: float) -> int:
    if _WAQI_TOKEN:
        data = _fetch_json_local(
            f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={_WAQI_TOKEN}"
        )
        if data and data.get("status") == "ok":
            aqi = data["data"].get("aqi", 0)
            if isinstance(aqi, (int, float)):
                return int(aqi)
    params = urllib.parse.urlencode({
        "latitude": lat, "longitude": lon,
        "current": "us_aqi", "timezone": "auto",
    })
    data = _fetch_json_local(
        f"https://air-quality-api.open-meteo.com/v1/air-quality?{params}"
    )
    if data and data.get("current"):
        return int(data["current"].get("us_aqi", 50))
    return 50


def _dijkstra_rank_local(aqi_scores: list) -> list:
    n = len(aqi_scores)
    dist = list(aqi_scores)
    pq = [(aqi_scores[i], i) for i in range(n)]
    heapq.heapify(pq)
    visited, order = set(), []
    while pq:
        d, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)
        order.append(u)
        for v in range(n):
            if v not in visited:
                w = (aqi_scores[u] + aqi_scores[v]) / 2
                if d + w < dist[v]:
                    dist[v] = d + w
                    heapq.heappush(pq, (dist[v], v))
    return order


def _greedy_best_local(routes: list) -> int:
    best_idx, best_ratio = 0, float('inf')
    for i, r in enumerate(routes):
        dist_km = r["distance_m"] / 1000
        ratio = r["aqi"] / dist_km if dist_km > 0 else float('inf')
        if ratio < best_ratio:
            best_ratio, best_idx = ratio, i
    return best_idx


_ROUTE_META = [
    {"id": "fastest",  "name": "Fastest Route",    "color": "#2563eb"},
    {"id": "shortest", "name": "Shortest Route",    "color": "#7c3aed"},
    {"id": "scenic",   "name": "Alternative Route", "color": "#d97706"},
]


class RoutesRequest(BaseModel):
    start: dict   # {"lat": float, "lon": float}
    end: dict
    mode: Optional[str] = "pedestrian"


@app.post("/routes")
def run_routes(request: RoutesRequest):
    """TomTom routing + Dijkstra/Greedy DAA scoring (Units II & III)"""
    if not _TOMTOM_KEY:
        raise HTTPException(status_code=503, detail="TOMTOM_API_KEY not configured")

    s, e = request.start, request.end
    travel_mode = "bicycle" if request.mode == "cyclist" else "pedestrian"
    coords = f"{s['lat']},{s['lon']}:{e['lat']},{e['lon']}"
    params = urllib.parse.urlencode({
        "key": _TOMTOM_KEY, "maxAlternatives": 2,
        "travelMode": travel_mode, "traffic": "true", "routeType": "fastest",
    })
    url = f"https://api.tomtom.com/routing/1/calculateRoute/{coords}/json?{params}"
    data = _fetch_json_local(url)
    if not data or "routes" not in data:
        raise HTTPException(status_code=502, detail="TomTom returned no routes")

    route_data = []
    for rt in data["routes"][:3]:
        summary = rt.get("summary", {})
        points = rt.get("legs", [{}])[0].get("points", [])
        if not points:
            continue
        mid = points[len(points) // 2]
        aqi = _get_aqi_local(mid["latitude"], mid["longitude"])
        route_data.append({
            "points": points,
            "aqi": aqi,
            "duration_s": summary.get("travelTimeInSeconds", 0),
            "distance_m": summary.get("lengthInMeters", 0),
        })

    if not route_data:
        raise HTTPException(status_code=502, detail="No usable routes returned")

    aqi_scores = [r["aqi"] for r in route_data]
    dijk_order = _dijkstra_rank_local(aqi_scores)
    greedy_win = _greedy_best_local(route_data)

    result = []
    for pos, ri in enumerate(dijk_order):
        r = route_data[ri]
        meta = _ROUTE_META[ri] if ri < len(_ROUTE_META) else _ROUTE_META[-1]
        if pos == 0:
            name, algo, color, rec = "Cleanest Air Path", "Dijkstra (AQI-weighted, Python)", "#22c55e", True
        elif ri == greedy_win:
            name, algo, color, rec = "Optimal Exposure", "Greedy Selection (Python)", "#f97316", False
        else:
            name, algo, color, rec = meta["name"], "TomTom Traffic-Aware", meta["color"], False
        result.append({
            "id": f"{meta['id']}-{ri}",
            "name": name, "algorithm": algo, "color": color,
            "duration": f"{round(r['duration_s']/60)} min",
            "distance": f"{r['distance_m']/1000:.1f} km",
            "pollutionScore": r["aqi"],
            "inhaledDose": round(r["aqi"] * (r["duration_s"] / 60) * 0.014),
            "visible": True, "isRecommended": rec,
            "coordinates": [[p["latitude"], p["longitude"]] for p in r["points"]],
        })
    return result


@app.get("/pollution")
def run_pollution(lat: float = Query(28.6315), lon: float = Query(77.2167)):
    """WAQI pollution proxy with Open-Meteo fallback (Unit IV closest-pair demo)"""
    if _WAQI_TOKEN:
        data = _fetch_json_local(
            f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={_WAQI_TOKEN}"
        )
        if data and data.get("status") == "ok":
            d = data["data"]
            iaqi = d.get("iaqi", {})
            return {
                "aqi": d.get("aqi", 0),
                "pm25": iaqi.get("pm25", {}).get("v", 0),
                "pm10": iaqi.get("pm10", {}).get("v", 0),
                "no2": iaqi.get("no2", {}).get("v", 0),
                "o3": iaqi.get("o3", {}).get("v", 0),
                "station": d.get("city", {}).get("name", "Unknown"),
                "source": "waqi",
            }
    # Fallback
    params = urllib.parse.urlencode({
        "latitude": lat, "longitude": lon,
        "current": "us_aqi,pm2_5,nitrogen_dioxide,ozone", "timezone": "auto",
    })
    data = _fetch_json_local(
        f"https://air-quality-api.open-meteo.com/v1/air-quality?{params}"
    )
    cur = data.get("current", {}) if data else {}
    return {
        "aqi": cur.get("us_aqi", 50),
        "pm25": cur.get("pm2_5", 15),
        "pm10": 0,
        "no2": cur.get("nitrogen_dioxide", 10),
        "o3": cur.get("ozone", 20),
        "station": "Open-Meteo (fallback)",
        "source": "open-meteo",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
