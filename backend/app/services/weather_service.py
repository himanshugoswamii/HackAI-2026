"""Lightweight weather API - Open-Meteo (no API key required)"""
import httpx


async def get_weather_context(lat: float = 40.7128, lon: float = -74.0060) -> str:
    """Fetch current weather and return a short context string for AI agents."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,weather_code,precipitation",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "timezone": "auto",
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()
    
    curr = data.get("current", {})
    temp = curr.get("temperature_2m", 20)
    code = curr.get("weather_code", 0)
    
    # WMO weather codes: 0=clear, 1-3=cloudy, 45/48=fog, 51-67=rain, 71-77=snow, 80-82=showers
    if code == 0:
        cond = "clear"
    elif code in (1, 2, 3):
        cond = "partly cloudy"
    elif code in (45, 48):
        cond = "foggy"
    elif 51 <= code <= 67 or 80 <= code <= 82:
        cond = "rainy"
    elif 71 <= code <= 77:
        cond = "snowy"
    else:
        cond = "variable"
    
    # Simple season heuristic from temp
    if temp < 5:
        season = "winter"
    elif temp < 15:
        season = "fall/spring"
    elif temp < 25:
        season = "spring/summer"
    else:
        season = "summer"
    
    return f"{season}, {cond}, ~{int(temp)}°C ({int(temp * 9/5 + 32)}°F)"
