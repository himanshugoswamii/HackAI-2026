"""Lightweight weather API - Open-Meteo (no API key required).
Uses Python's built-in urllib - no extra dependencies, plain HTTPS request."""
import json
import urllib.request
from urllib.parse import urlencode


def get_current_season(lat: float = 40.7128, lon: float = -74.0060) -> str:
    """
    Fetch current temperature and return season: summer, winter, spring, fall.
    Simple logic: temp < 5°C → winter, < 15°C → fall, < 25°C → spring, else summer.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m",
        "timezone": "auto",
    }
    url = "https://api.open-meteo.com/v1/forecast?" + urlencode(params)

    # Bypass system proxy (ProxyHandler({})) - direct HTTPS to Open-Meteo
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        # SUPER SHORT timeout so the UI never blocks. Fallback to 'all-season' if it fails.
        with opener.open(url, timeout=1.0) as resp:
            data = json.loads(resp.read().decode())
        
        temp = data.get("current", {}).get("temperature_2m", 20)
        if temp < 5:
            return "winter"
        if temp < 15:
            return "fall"
        if temp < 25:
            return "spring"
        return "summer"
    except Exception as e:
        print(f"Weather API timeout/error: {e}. Falling back to 'all-season'.")
        return "all-season"
