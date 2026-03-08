"""Weather API - lightweight Open-Meteo"""
from fastapi import APIRouter

from app.services.weather_service import get_weather_context

router = APIRouter()


@router.get("/context")
async def weather_context(lat: float = 40.7128, lon: float = -74.0060):
    """Get weather context string for AI agents (season, conditions, temp)."""
    return {"context": await get_weather_context(lat, lon)}
