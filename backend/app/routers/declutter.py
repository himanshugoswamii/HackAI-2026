"""Monica - Declutter Agent"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import WardrobeItem
from app.schemas import DeclutterRequest, DeclutterResponse
from app.services.gemini_service import get_declutter_suggestion
from app.services.weather_service import get_weather_context

router = APIRouter()

SIX_MONTHS_AGO = datetime.utcnow() - timedelta(days=180)


def _parse_monica_response(text: str) -> tuple[list[int], str]:
    item_ids = []
    explanation = ""
    for line in text.split("\n"):
        line = line.strip()
        if line.upper().startswith("DECLUTTER:"):
            ids_str = line.split(":", 1)[1].strip()
            item_ids = [int(x.strip()) for x in ids_str.replace(",", " ").split() if x.strip().isdigit()]
        elif line.upper().startswith("EXPLANATION:"):
            explanation = line.split(":", 1)[1].strip()
    return item_ids, explanation or text


@router.post("/suggest", response_model=DeclutterResponse)
async def suggest_declutter(
    req: DeclutterRequest,
    lat: float = 40.71,
    lon: float = -74.01,
    db: AsyncSession = Depends(get_db),
):
    user_id = req.user_id
    """Monica suggests items to donate (not worn in 6+ months, weather-appropriate)."""
    r = await db.execute(
        select(WardrobeItem).where(
            WardrobeItem.user_id == user_id,
            (WardrobeItem.last_worn_at == None) | (WardrobeItem.last_worn_at < SIX_MONTHS_AGO),
        )
    )
    items = [row for row in r.scalars().all()]
    
    wardrobe_for_ai = [
        {
            "id": i.id,
            "category": (i.attributes or {}).get("category", "unknown"),
            "color": (i.attributes or {}).get("color", ""),
            "season": (i.attributes or {}).get("season", ""),
            "last_worn_at": str(i.last_worn_at) if i.last_worn_at else "never",
        }
        for i in items
    ]
    
    weather = await get_weather_context(lat, lon)
    text = get_declutter_suggestion(wardrobe_items=wardrobe_for_ai, weather_context=weather)
    item_ids, explanation = _parse_monica_response(text)
    return DeclutterResponse(item_ids=item_ids, explanation=explanation)
