"""Google Gemini API service for vision + text"""
import base64
import json
from typing import Optional

import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.gemini_api_key)


def classify_clothing(image_base64: str, mime_type: str = "image/jpeg") -> dict:
    """Use Gemini Vision to classify clothing attributes."""
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = """Analyze this clothing item image and return a JSON object with these attributes:
- category: (e.g., shirt, pants, dress, jacket, shoes, accessory)
- color: primary color
- pattern: (e.g., solid, striped, floral, plaid)
- formality: (casual, semi-formal, formal)
- season: (spring, summer, fall, winter, all-season)
- material: if identifiable
Return ONLY valid JSON, no markdown or extra text."""

    image_data = base64.b64decode(image_base64)
    
    response = model.generate_content([
        {"inline_data": {"mime_type": mime_type, "data": image_data}},
        prompt
    ])
    
    text = response.text.strip()
    if "```" in text:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            text = text[start:end]
    return json.loads(text)


def get_outfit_suggestion(
    user_age: int,
    user_gender: str,
    style_preference: str,
    wardrobe_items: list[dict],
    weather_context: str,
    occasion: Optional[str] = None,
    inspiration_context: Optional[str] = None,
) -> str:
    """Miranda: Generate outfit suggestion with natural language explanation."""
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    wardrobe_desc = json.dumps(wardrobe_items[:30], indent=2)  # limit context
    
    prompt = f"""You are Miranda, a friendly AI Personal Stylist. Suggest an outfit for this user.

User profile:
- Age: {user_age}
- Gender: {user_gender}
- Style preference: {style_preference}
{f'- Occasion: {occasion}' if occasion else ''}

Current weather/season: {weather_context}
{f'Inspiration notes: {inspiration_context}' if inspiration_context else ''}

Available wardrobe items (id, category, color, pattern, formality):
{wardrobe_desc}

Respond with:
1. A list of item IDs to wear (e.g., "1, 3, 5")
2. A warm, natural language explanation of why this outfit works (2-3 sentences).

Format your response as:
OUTFIT: 1,3,5
EXPLANATION: [Your explanation here]"""

    response = model.generate_content(prompt)
    return response.text.strip()


def get_declutter_suggestion(
    wardrobe_items: list[dict],
    weather_context: str,
) -> str:
    """Monica: Suggest items to declutter (not worn in 6+ months, weather-appropriate)."""
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    items_desc = json.dumps(wardrobe_items, indent=2)
    
    prompt = f"""You are Monica, a practical Declutter Agent. Suggest wardrobe items to donate.

Rules:
- Only suggest items NOT worn in 6+ months
- Current weather/season must be appropriate for the clothing
- Prefer items that are clearly redundant or underused

Current weather/season: {weather_context}

Wardrobe items (with last_worn_at - items with null or 6+ months ago):
{items_desc}

Respond with:
1. A list of item IDs to declutter (e.g., "2, 4, 7")
2. A brief, friendly explanation.

Format:
DECLUTTER: 2,4,7
EXPLANATION: [Your explanation]"""

    response = model.generate_content(prompt)
    return response.text.strip()
