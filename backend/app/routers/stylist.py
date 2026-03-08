"""Miranda - AI Stylist Agent"""
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, WardrobeItem
from app.schemas import OutfitRequest, OutfitResponse
from app.services.gemini_service import get_outfit_suggestion
from app.services.weather_service import get_weather_context

router = APIRouter()


def _parse_miranda_response(text: str) -> tuple[list[int], str]:
    outfit_ids = []
    explanation = ""
    for line in text.split("\n"):
        line = line.strip()
        if line.upper().startswith("OUTFIT:"):
            ids_str = line.split(":", 1)[1].strip()
            outfit_ids = [int(x.strip()) for x in ids_str.replace(",", " ").split() if x.strip().isdigit()]
        elif line.upper().startswith("EXPLANATION:"):
            explanation = line.split(":", 1)[1].strip()
    return outfit_ids, explanation or text


@router.post("/suggest", response_model=OutfitResponse)
async def suggest_outfit(
    req: OutfitRequest,
    lat: float = 40.71,
    lon: float = -74.01,
    db: AsyncSession = Depends(get_db),
):
    """Miranda suggests an outfit based on profile, wardrobe, weather, preferences."""
    r = await db.execute(select(User).where(User.id == req.user_id))
    user = r.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    
    r = await db.execute(select(WardrobeItem).where(WardrobeItem.user_id == req.user_id))
    items = [row for row in r.scalars().all()]
    
    wardrobe_for_ai = [
        {
            "id": i.id,
            "category": (i.attributes or {}).get("category", "unknown"),
            "color": (i.attributes or {}).get("color", ""),
            "pattern": (i.attributes or {}).get("pattern", ""),
            "formality": (i.attributes or {}).get("formality", ""),
        }
        for i in items
    ]
    
    weather = await get_weather_context(lat, lon)
    
    text = get_outfit_suggestion(
        user_age=user.age,
        user_gender=user.gender,
        style_preference=user.style_preference or "casual",
        wardrobe_items=wardrobe_for_ai,
        weather_context=weather,
        occasion=req.occasion,
    )
    
    outfit_ids, explanation = _parse_miranda_response(text)
    return OutfitResponse(outfit_ids=outfit_ids, explanation=explanation)
