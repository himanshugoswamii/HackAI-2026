"""StylistAgent - outfit suggestions via Gemini text model."""
import json
import re
from typing import Optional

import google.generativeai as genai

from config import GEMINI_API_KEY, GEMINI_MODEL


def _parse_outfits_json(text: str) -> dict:
    """Extract JSON from Gemini response; handle markdown and extra text."""
    text = text.strip()
    if "```" in text:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
        if match:
            text = match.group(1).strip()
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        text = text[start:end]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        raise ValueError("Could not parse stylist response as JSON")


def _wardrobe_to_desc(item: dict) -> str:
    """Convert wardrobe item to descriptive string (e.g., 'blue casual shirt')."""
    color = item.get("color", "").strip()
    style = item.get("style", "").strip()
    typ = item.get("type", "").strip()
    parts = [p for p in (color, style, typ) if p]
    return " ".join(parts).lower() if parts else str(item)


def _match_item_to_wardrobe(item_str: str, wardrobe_items: list[dict]) -> dict:
    """Find wardrobe item matching the descriptive string. Returns {label, image_path}."""
    s = item_str.strip().lower()
    for w in wardrobe_items:
        desc = _wardrobe_to_desc(w)
        if desc and (desc == s or desc in s or s in desc):
            return {"label": item_str, "image_path": w.get("image_path", "")}
    for w in wardrobe_items:
        color = (w.get("color") or "").lower()
        typ = (w.get("type") or "").lower()
        if color in s and typ in s:
            return {"label": item_str, "image_path": w.get("image_path", "")}
    return {"label": item_str, "image_path": ""}


class StylistAgent:
    """Suggests outfits from wardrobe items using Gemini text model."""

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or GEMINI_API_KEY
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY required for StylistAgent")

    def suggest(
        self,
        age: int,
        style_preference: str,
        season: str,
        wardrobe_items: list[dict],
        inspiration_description: Optional[str] = None,
    ) -> dict:
        """
        Returns: { "outfits": [ { "title": str, "items": [str], "reason": str } ] }
        Only items from wardrobe_items are used.
        """
        genai.configure(api_key=self.api_key)

        # Build list of available items as descriptive strings
        item_descs = [_wardrobe_to_desc(it) for it in wardrobe_items]
        if not item_descs:
            return {"outfits": []}

        wardrobe_text = "\n".join(f"- {d}" for d in item_descs)

        prompt = f"""You are a personal stylist. Suggest exactly 3 outfit combinations using ONLY the items listed below.
Do NOT suggest any item not in the list.

User: age {age}, style preference: {style_preference}
Current season: {season}
{f"Inspiration / mood: {inspiration_description}" if inspiration_description else ""}

Available wardrobe items (use only these, refer to them exactly as listed):
{wardrobe_text}

Return a JSON object with exactly this structure:
{{
  "outfits": [
    {{
      "title": "Outfit 1",
      "items": ["exact item from list above", "another exact item from list"],
      "reason": "A warm, natural 1-2 sentence explanation of why this outfit matches the user's style and the season."
    }}
  ]
}}

Rules:
- Each "items" array must contain ONLY strings that exactly match items from the available list (e.g. "blue casual shirt").
- Suggest exactly 3 outfits.
- "reason" should be conversational and specific.
Return ONLY valid JSON. No markdown, no extra text."""

        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)

        if not response.candidates or not response.candidates[0].content.parts:
            return {"outfits": []}
        text = (response.text or "").strip()
        if not text:
            return {"outfits": []}
        raw = _parse_outfits_json(text)

        if "outfits" not in raw or not isinstance(raw["outfits"], list):
            return {"outfits": []}

        outfits = []
        for o in raw["outfits"][:3]:
            if not isinstance(o, dict):
                continue
            title = o.get("title", "Outfit")
            items = o.get("items", [])
            if isinstance(items, list):
                items = [str(i) for i in items if i]
            else:
                items = []
            reason = o.get("reason", "")
            item_images = [
                _match_item_to_wardrobe(s, wardrobe_items) for s in items
            ]
            if isinstance(reason, str):
                outfits.append({
                    "title": title,
                    "items": items,
                    "reason": reason,
                    "item_images": item_images,
                })

        return {"outfits": outfits}
