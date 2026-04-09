"""
Greedy Activity Selection on Road Segments — Python Implementation
DAA Unit II: Greedy Algorithms

Vercel Python Serverless Function.
Models each road segment as an interval [start, end] with an AQI pollution cost.
Selects non-overlapping segments with minimum total AQI — directly applying
the Activity Selection Problem to clean-air route planning.

Time: O(n log n)  Space: O(n)
"""

import json
from http.server import BaseHTTPRequestHandler


# ---------------------------------------------------------------------------
# Sample Delhi route segments (used for demo)
# ---------------------------------------------------------------------------
SAMPLE_SEGMENTS = [
    {"id": "s1", "start": 0.0, "end": 0.4, "aqi_cost": 42,  "label": "Connaught Place → Rajpath"},
    {"id": "s2", "start": 0.2, "end": 0.6, "aqi_cost": 78,  "label": "Ring Road (high traffic)"},
    {"id": "s3", "start": 0.4, "end": 0.7, "aqi_cost": 35,  "label": "Lodhi Garden corridor"},
    {"id": "s4", "start": 0.6, "end": 0.9, "aqi_cost": 55,  "label": "India Gate approach"},
    {"id": "s5", "start": 0.7, "end": 1.0, "aqi_cost": 48,  "label": "Kartavya Path (tree-lined)"},
    {"id": "s6", "start": 0.0, "end": 0.3, "aqi_cost": 90,  "label": "Flyover (diesel exhaust)"},
    {"id": "s7", "start": 0.3, "end": 0.65,"aqi_cost": 30,  "label": "Safdarjung bypass (clean)"},
]


def greedy_clean_route(segments: list[dict]) -> dict:
    """
    Activity Selection: pick non-overlapping segments with lowest total AQI.

    Greedy choice: sort by end position, then pick the next segment that
    starts at or after the last selected segment ends.

    Args:
        segments: list of {id, start, end, aqi_cost, label}

    Returns:
        selected segments, total AQI, coverage ratio
    """
    if not segments:
        return {"selected": [], "total_aqi": 0, "coverage_ratio": 0.0}

    # Sort by end position (canonical Activity Selection sort)
    sorted_segs = sorted(segments, key=lambda s: s["end"])

    selected = []
    last_end = float('-inf')

    for seg in sorted_segs:
        if seg["start"] >= last_end:
            selected.append(seg)
            last_end = seg["end"]

    total_aqi = sum(s["aqi_cost"] for s in selected)
    route_length = max(s["end"] for s in segments) if segments else 1
    covered = sum(s["end"] - s["start"] for s in selected)
    coverage_ratio = round(covered / route_length, 3) if route_length > 0 else 0

    return {
        "selected": selected,
        "total_aqi": total_aqi,
        "coverage_ratio": coverage_ratio,
        "rejected": [s for s in sorted_segs if s not in selected],
    }


def add_cors(h):
    h.send_header('Access-Control-Allow-Origin', '*')
    h.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    h.send_header('Access-Control-Allow-Headers', 'Content-Type')


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        add_cors(self)
        self.end_headers()

    def do_GET(self):
        self._run(SAMPLE_SEGMENTS)

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length)) if length else {}
        segments = body.get('segments', SAMPLE_SEGMENTS)
        self._run(segments)

    def _run(self, segments: list):
        result = greedy_clean_route(segments)
        result.update({
            "algorithm": "Greedy Activity Selection",
            "unit": "Unit II",
            "complexity": "O(n log n)",
            "description": (
                "Sorts road segments by end position and greedily picks "
                "non-overlapping segments with minimum AQI cost."
            ),
        })

        body = json.dumps(result).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        add_cors(self)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass
