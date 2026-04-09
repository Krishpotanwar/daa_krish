"""
/api/pollution — Python Vercel Serverless Function
Unit: DAA Lab (PureWay)

Proxies WAQI (World Air Quality Index) API for real pollution data.
WAQI_TOKEN is read from server environment — never exposed to the browser.
Falls back to Open-Meteo (free, no key) if token is missing or WAQI fails.
"""
import os
import json
import urllib.request
import urllib.parse
from http.server import BaseHTTPRequestHandler

WAQI_TOKEN = os.environ.get("WAQI_TOKEN", "")


def _cors(handler):
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")


def _fetch_waqi(lat: float, lon: float) -> dict | None:
    """Call WAQI geo feed API. Returns parsed dict or None on failure."""
    if not WAQI_TOKEN:
        return None
    url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_TOKEN}"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.loads(resp.read())
        if data.get("status") != "ok":
            return None
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
    except Exception:
        return None


def _fetch_open_meteo(lat: float, lon: float) -> dict:
    """Fallback: Open-Meteo free air quality API (no key required, global)."""
    params = urllib.parse.urlencode({
        "latitude": lat,
        "longitude": lon,
        "current": "us_aqi,pm2_5,nitrogen_dioxide,ozone",
        "timezone": "auto",
    })
    url = f"https://air-quality-api.open-meteo.com/v1/air-quality?{params}"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.loads(resp.read())
        cur = data.get("current", {})
        return {
            "aqi": cur.get("us_aqi", 50),
            "pm25": cur.get("pm2_5", 15),
            "pm10": 0,
            "no2": cur.get("nitrogen_dioxide", 10),
            "o3": cur.get("ozone", 20),
            "station": "Open-Meteo (fallback)",
            "source": "open-meteo",
        }
    except Exception:
        return {"aqi": 50, "pm25": 15, "pm10": 0, "no2": 10, "o3": 20,
                "station": "Default fallback", "source": "default"}


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # suppress Vercel log spam

    def do_OPTIONS(self):
        self.send_response(200)
        _cors(self)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        try:
            lat = float(qs.get("lat", ["28.6315"])[0])
            lon = float(qs.get("lon", ["77.2167"])[0])
        except (ValueError, IndexError):
            self.send_response(400)
            _cors(self)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Invalid lat/lon"}).encode())
            return

        result = _fetch_waqi(lat, lon) or _fetch_open_meteo(lat, lon)

        self.send_response(200)
        _cors(self)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())
