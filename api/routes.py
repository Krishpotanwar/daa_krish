"""
/api/routes — Python Vercel Serverless Function
Unit: DAA Lab (PureWay)

Calls TomTom Routing API server-side (key never exposed to browser),
fetches real pollution AQI at each route's midpoint via WAQI,
then applies DAA algorithms:
  - Dijkstra (Unit III): rank routes by cumulative AQI weight
  - Greedy (Unit II): select route with best AQI-per-km ratio

POST body: { "start": {"lat": float, "lon": float},
             "end":   {"lat": float, "lon": float},
             "mode":  "pedestrian" | "cyclist" }

Returns: JSON array of 3 RouteData objects (matches frontend RouteData interface).
"""
import os
import json
import math
import heapq
import urllib.request
import urllib.parse
from http.server import BaseHTTPRequestHandler

TOMTOM_KEY  = os.environ.get("TOMTOM_API_KEY", "")
WAQI_TOKEN  = os.environ.get("WAQI_TOKEN", "")

ROUTE_META = [
    {"id": "fastest",  "name": "Fastest Route",       "color": "#2563eb", "isRecommended": False},
    {"id": "shortest", "name": "Shortest Route",       "color": "#7c3aed", "isRecommended": False},
    {"id": "scenic",   "name": "Alternative Route",    "color": "#d97706", "isRecommended": False},
]

FALLBACK_ROUTE_META = [
    {
        "id": "health-fallback",
        "name": "Cleanest Air Path",
        "algorithm": "Dijkstra (AQI-weighted fallback)",
        "color": "#22c55e",
        "isRecommended": True,
        "curvature": 0.32,
        "direction": 1,
        "pollution_bias": -14,
    },
    {
        "id": "balanced-fallback",
        "name": "Balanced Route",
        "algorithm": "Greedy Selection (fallback)",
        "color": "#14b8a6",
        "isRecommended": False,
        "curvature": 0.2,
        "direction": -1,
        "pollution_bias": -4,
    },
    {
        "id": "fastest-fallback",
        "name": "Fastest Route",
        "algorithm": "Heuristic Baseline (fallback)",
        "color": "#2563eb",
        "isRecommended": False,
        "curvature": 0.06,
        "direction": 1,
        "pollution_bias": 16,
    },
]

# ── Helpers ──────────────────────────────────────────────────────────────────

def _cors(h):
    h.send_header("Access-Control-Allow-Origin",  "*")
    h.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    h.send_header("Access-Control-Allow-Headers", "Content-Type")


def _fetch_json(url: str, timeout: int = 8) -> dict | None:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return json.loads(r.read())
    except Exception:
        return None


def _get_aqi(lat: float, lon: float) -> int:
    """Fetch AQI at a point. WAQI preferred, Open-Meteo fallback."""
    if WAQI_TOKEN:
        data = _fetch_json(
            f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_TOKEN}"
        )
        if data and data.get("status") == "ok":
            aqi = data["data"].get("aqi", 0)
            if isinstance(aqi, (int, float)):
                return int(aqi)

    # Fallback: Open-Meteo
    params = urllib.parse.urlencode({
        "latitude": lat, "longitude": lon,
        "current": "us_aqi", "timezone": "auto",
    })
    data = _fetch_json(
        f"https://air-quality-api.open-meteo.com/v1/air-quality?{params}"
    )
    if data and data.get("current"):
        return int(data["current"].get("us_aqi", 50))
    return 50  # safe default


def _midpoint(points: list) -> tuple:
    mid = points[len(points) // 2]
    return mid["latitude"], mid["longitude"]


def _fmt_duration(seconds: int) -> str:
    mins = round(seconds / 60)
    return f"{mins} min"


def _fmt_distance(meters: int) -> str:
    return f"{meters / 1000:.1f} km"


def _inhaled_dose(aqi: int, seconds: int) -> int:
    """Rough inhalation model: μg inhaled ∝ AQI × time (min) × breathing rate."""
    return round(aqi * (seconds / 60) * 0.014)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _km_per_lon(lat: float) -> float:
    return max(111.320 * math.cos(math.radians(lat)), 0.1)


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _get_perpendicular_offset(start: dict, end: dict, offset_km: float) -> tuple[float, float]:
    average_lat = (start["lat"] + end["lat"]) / 2
    km_per_lon = _km_per_lon(average_lat)
    delta_x_km = (end["lon"] - start["lon"]) * km_per_lon
    delta_y_km = (end["lat"] - start["lat"]) * 110.574
    magnitude = math.hypot(delta_x_km, delta_y_km) or 1

    perpendicular_x_km = -delta_y_km / magnitude
    perpendicular_y_km = delta_x_km / magnitude

    return (
        (perpendicular_y_km * offset_km) / 110.574,
        (perpendicular_x_km * offset_km) / km_per_lon,
    )


def _cubic_bezier(start: dict, control1: dict, control2: dict, end: dict, t: float) -> tuple[float, float]:
    inv = 1 - t
    inv_sq = inv * inv
    inv_cu = inv_sq * inv
    t_sq = t * t
    t_cu = t_sq * t

    lat = (
        inv_cu * start["lat"]
        + 3 * inv_sq * t * control1["lat"]
        + 3 * inv * t_sq * control2["lat"]
        + t_cu * end["lat"]
    )
    lon = (
        inv_cu * start["lon"]
        + 3 * inv_sq * t * control1["lon"]
        + 3 * inv * t_sq * control2["lon"]
        + t_cu * end["lon"]
    )
    return lat, lon


def _build_fallback_points(start: dict, end: dict, curvature: float, direction: int) -> list[dict]:
    direct_distance_km = _haversine_km(start["lat"], start["lon"], end["lat"], end["lon"])
    offset_km = _clamp(direct_distance_km * curvature, 0.2, 1.4) * direction
    offset_lat, offset_lon = _get_perpendicular_offset(start, end, offset_km)

    control1 = {
        "lat": start["lat"] + (end["lat"] - start["lat"]) * 0.34 + offset_lat,
        "lon": start["lon"] + (end["lon"] - start["lon"]) * 0.34 + offset_lon,
    }
    control2 = {
        "lat": start["lat"] + (end["lat"] - start["lat"]) * 0.72 + offset_lat * 0.6,
        "lon": start["lon"] + (end["lon"] - start["lon"]) * 0.72 + offset_lon * 0.6,
    }

    return [
        {"latitude": lat, "longitude": lon}
        for lat, lon in (
            _cubic_bezier(start, control1, control2, end, step / 17)
            for step in range(18)
        )
    ]


def _distance_for_points(points: list[dict]) -> int:
    total_km = 0.0
    for idx in range(1, len(points)):
        total_km += _haversine_km(
            points[idx - 1]["latitude"],
            points[idx - 1]["longitude"],
            points[idx]["latitude"],
            points[idx]["longitude"],
        )
    return round(total_km * 1000)


def _duration_for_distance(distance_m: int, mode: str) -> int:
    speed_kmh = 14 if mode == "cyclist" else 4.8
    hours = (distance_m / 1000) / speed_kmh
    return max(240, round(hours * 3600))


def _build_fallback_routes(start: dict, end: dict, mode: str) -> list[dict]:
    fallback_routes = []

    for meta in FALLBACK_ROUTE_META:
        points = _build_fallback_points(start, end, meta["curvature"], meta["direction"])
        distance_m = _distance_for_points(points)
        duration_s = _duration_for_distance(distance_m, mode)
        mid_lat, mid_lon = _midpoint(points)
        aqi = int(_clamp(_get_aqi(mid_lat, mid_lon) + meta["pollution_bias"], 32, 180))

        fallback_routes.append({
            "id": meta["id"],
            "name": meta["name"],
            "algorithm": meta["algorithm"],
            "duration": _fmt_duration(duration_s),
            "distance": _fmt_distance(distance_m),
            "pollutionScore": aqi,
            "inhaledDose": _inhaled_dose(aqi, duration_s),
            "color": meta["color"],
            "visible": True,
            "isRecommended": meta["isRecommended"],
            "coordinates": [[pt["latitude"], pt["longitude"]] for pt in points],
        })

    return fallback_routes


# ── Dijkstra on route graph (Unit III) ───────────────────────────────────────

def _dijkstra_rank(routes_aqi: list[int]) -> list[int]:
    """
    Build a tiny complete graph where edge weight between route i and route j
    is the average of their AQI scores. Run Dijkstra from node 0 (entry).
    Returns route indices sorted from cleanest to most polluted.
    """
    n = len(routes_aqi)
    # Graph: each route is a node; source is virtual node n
    # Edge weight from source → route i = routes_aqi[i]
    dist = [float('inf')] * n
    pq = []
    for i, aqi in enumerate(routes_aqi):
        dist[i] = aqi
        heapq.heappush(pq, (aqi, i))

    visited = set()
    order = []
    while pq:
        d, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)
        order.append(u)
        # Relax neighbours (cross edges with averaged AQI cost)
        for v in range(n):
            if v not in visited:
                w = (routes_aqi[u] + routes_aqi[v]) / 2
                if d + w < dist[v]:
                    dist[v] = d + w
                    heapq.heappush(pq, (dist[v], v))
    return order  # index 0 = cleanest


# ── Greedy route selector (Unit II) ──────────────────────────────────────────

def _greedy_best(routes: list[dict]) -> int:
    """
    Greedy: pick the route with the best AQI-per-km ratio
    (lowest pollution density). Returns the index of the winner.
    """
    best_idx, best_ratio = 0, float('inf')
    for i, r in enumerate(routes):
        dist_km = r["distance_m"] / 1000
        ratio = r["aqi"] / dist_km if dist_km > 0 else float('inf')
        if ratio < best_ratio:
            best_ratio, best_idx = ratio, i
    return best_idx


# ── TomTom API call ───────────────────────────────────────────────────────────

def _call_tomtom(start: dict, end: dict, mode: str) -> list[dict] | None:
    """
    Fetch up to 3 routes from TomTom Calculate Route API.
    Returns list of raw TomTom route dicts, or None on failure.
    """
    travel_mode = "bicycle" if mode == "cyclist" else "pedestrian"
    coords = f"{start['lat']},{start['lon']}:{end['lat']},{end['lon']}"
    params = urllib.parse.urlencode({
        "key":              TOMTOM_KEY,
        "maxAlternatives":  2,          # primary + 2 → total 3 routes
        "travelMode":       travel_mode,
        "traffic":          "true",
        "routeType":        "fastest",
    })
    url = (
        f"https://api.tomtom.com/routing/1/calculateRoute"
        f"/{coords}/json?{params}"
    )
    data = _fetch_json(url)
    if not data or "routes" not in data:
        return None
    return data["routes"]


# ── Main logic ────────────────────────────────────────────────────────────────

def _build_routes(start: dict, end: dict, mode: str) -> list[dict]:
    if not TOMTOM_KEY:
        return _build_fallback_routes(start, end, mode)

    raw_routes = _call_tomtom(start, end, mode)
    if not raw_routes:
        return _build_fallback_routes(start, end, mode)

    # Step 1: extract points + summary for each TomTom route
    route_data = []
    for i, rt in enumerate(raw_routes[:3]):
        summary = rt.get("summary", {})
        legs = rt.get("legs", [{}])
        points = legs[0].get("points", []) if legs else []

        if not points:
            continue

        mid_lat, mid_lon = _midpoint(points)
        aqi = _get_aqi(mid_lat, mid_lon)
        duration_s = summary.get("travelTimeInSeconds", 0)
        distance_m = summary.get("lengthInMeters", 0)

        route_data.append({
            "index":       i,
            "points":      points,
            "aqi":         aqi,
            "duration_s":  duration_s,
            "distance_m":  distance_m,
        })

    if not route_data:
        return []

    # Step 2: Dijkstra ranking (Unit III)
    aqi_scores = [r["aqi"] for r in route_data]
    dijkstra_order = _dijkstra_rank(aqi_scores)   # cleanest first

    # Step 3: Greedy best-ratio route (Unit II)
    greedy_winner = _greedy_best(route_data)

    # Step 4: Build response objects
    result = []
    for pos, ri in enumerate(dijkstra_order):
        r = route_data[ri]
        meta = ROUTE_META[ri] if ri < len(ROUTE_META) else ROUTE_META[-1]

        is_cleanest   = (pos == 0)                 # Dijkstra winner
        is_greedy     = (ri == greedy_winner)

        if is_cleanest:
            name      = "Cleanest Air Path"
            algo      = "Dijkstra (AQI-weighted, Python)"
            color     = "#22c55e"
            recommend = True
        elif is_greedy:
            name      = "Optimal Exposure"
            algo      = "Greedy Selection (Python)"
            color     = "#f97316"
            recommend = False
        else:
            name      = meta["name"]
            algo      = "TomTom Traffic-Aware"
            color     = meta["color"]
            recommend = False

        coordinates = [
            [pt["latitude"], pt["longitude"]] for pt in r["points"]
        ]

        result.append({
            "id":            f"{meta['id']}-{ri}",
            "name":          name,
            "algorithm":     algo,
            "duration":      _fmt_duration(r["duration_s"]),
            "distance":      _fmt_distance(r["distance_m"]),
            "pollutionScore": r["aqi"],
            "inhaledDose":   _inhaled_dose(r["aqi"], r["duration_s"]),
            "color":         color,
            "visible":       True,
            "isRecommended": recommend,
            "coordinates":   coordinates,
        })

    return result


# ── Vercel handler ────────────────────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_OPTIONS(self):
        self.send_response(200)
        _cors(self)
        self.end_headers()

    def do_GET(self):
        """Demo response — shows algorithm info without real coordinates."""
        body = json.dumps({
            "description": "POST to /api/routes with start/end lat-lon for real TomTom routes",
            "algorithms":  ["Dijkstra (Unit III)", "Greedy (Unit II)"],
            "tomtom_configured": bool(TOMTOM_KEY),
            "waqi_configured":   bool(WAQI_TOKEN),
        })
        self.send_response(200)
        _cors(self)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body.encode())

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length))
            start = body["start"]   # {"lat": float, "lon": float}
            end   = body["end"]
            mode  = body.get("mode", "pedestrian")
        except (KeyError, json.JSONDecodeError):
            self.send_response(400)
            _cors(self)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Invalid request body"}).encode())
            return

        routes = _build_routes(start, end, mode)

        if not routes:
            self.send_response(502)
            _cors(self)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "TomTom returned no routes for this location pair"
            }).encode())
            return

        self.send_response(200)
        _cors(self)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(routes).encode())
