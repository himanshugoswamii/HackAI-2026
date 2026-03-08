"""DeclutterAgent - suggests donation for in-season items not worn within the time threshold."""
import json
import re
from datetime import datetime, timedelta, timezone

import google.generativeai as genai

from config import GEMINI_API_KEY, GEMINI_MODEL
from weather_service import get_current_season

# Demo: 5 minutes from last outfit suggestion (use days for production)
MINUTES_THRESHOLD = 5


def _parse_explanations_json(text: str, expected_count: int) -> list[str]:
    """Extract explanations array from Gemini response. Returns list of strings, one per item."""
    text = (text or "").strip()
    if "```" in text:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
        if match:
            text = match.group(1).strip()
    start = text.find("[")
    end = text.rfind("]") + 1
    if start >= 0 and end > start:
        text = text[start:end]
    # Also try {"explanations": [...]}
    obj_match = re.search(r'\{\s*"explanations"\s*:\s*(\[[\s\S]*?\])\s*\}', text)
    if obj_match:
        text = obj_match.group(1)
    try:
        arr = json.loads(text)
        if isinstance(arr, list):
            return [str(x).strip() if x else "" for x in arr[:expected_count]]
    except json.JSONDecodeError:
        pass
    return []


def _item_season_matches(item_season: str, current_season: str) -> bool:
    """True if item is suitable for current season (in-season)."""
    if not item_season:
        return False
    s = item_season.lower().strip()
    if s == "all-season":
        return True
    c = current_season.lower().strip()
    return s == c


def _parse_datetime(val) -> datetime | None:
    """Parse last_worn from string or datetime."""
    if val is None:
        return None
    if isinstance(val, datetime):
        return val
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


class DeclutterAgent:
    """Suggests in-season items to donate: match current season but not worn in MINUTES_THRESHOLD."""

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or GEMINI_API_KEY
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY required for DeclutterAgent")

    def suggest(
        self,
        wardrobe_items: list[dict],
        current_season: str | None = None,
        lat: float = 40.7128,
        lon: float = -74.0060,
        never_used_in_recent_outfits: bool = False,
    ) -> list[dict]:
        """
        Returns list of { item, explanation } for items to donate.
        Rule: item matches current season AND not worn within MINUTES_THRESHOLD (or never worn).
        When never_used_in_recent_outfits is True, items are already filtered to those not in the last 3 saved outfits.
        """
        season = current_season or get_current_season(lat, lon)
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=MINUTES_THRESHOLD)

        to_donate = []
        for it in wardrobe_items:
            last_worn = _parse_datetime(it.get("last_worn"))
            item_season = it.get("season", "")
            # Only in-season items
            if not _item_season_matches(item_season, season):
                continue
            # Include if never worn (demo) or not worn within threshold
            if last_worn is not None and last_worn > cutoff:
                continue

            desc = f"{it.get('color', '')} {it.get('type', 'item')}".strip() or str(it)
            to_donate.append({**it, "_desc": desc})

        if not to_donate:
            return []

        # Optimization: Limit to top 5 items so the AI processes it extremely quickly and avoids a huge payload
        to_donate = to_donate[:5]

        fallback = (
            "This piece wasn't in your last 3 chosen outfits—someone else could get good use out of it."
            if never_used_in_recent_outfits
            else "You haven't worn this in-season piece in a while—someone else could get good use out of it."
        )

        result = []
        for it in to_donate:
            item_out = {k: v for k, v in it.items() if not k.startswith("_")}
            for k, v in item_out.items():
                if hasattr(v, "isoformat"):
                    item_out[k] = v.isoformat()
            result.append({
                "item": item_out,
                "explanation": fallback,
            })

        return result
