"""Google Gemini Vision API - clothing classification & similarity."""
import io
import json
import re
from pathlib import Path

import google.generativeai as genai
from google.generativeai.types import HarmBlockThreshold, HarmCategory

from config import GEMINI_API_KEY, GEMINI_MODEL

# Higher resolution = better accuracy for textures/patterns.
_GEMINI_MAX_PX = 1024
_GEMINI_JPEG_QUALITY = 85

# Valid values for robust parsing and fallbacks
VALID_TYPES = {"shirt", "pants", "dress", "shoes", "jacket", "skirt", "sweater", "accessory", "blouse", "shorts", "coat", "hat", "scarf", "bag", "other"}
VALID_STYLES = {"casual", "classy", "streetwear", "sporty", "professional", "bohemian", "minimalist"}
VALID_SEASONS = {"summer", "winter", "spring", "fall", "all-season"}
VALID_FORMALITY = {"formal", "semi-formal", "casual", "partywear"}


def _parse_safe(text: str) -> dict:
    """Extract JSON from Gemini response, handling markdown and extra text."""
    if not text or not isinstance(text, str):
        raise ValueError("Gemini response could not be parsed as JSON")
    text = text.strip()
    if "```" in text:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
        if match:
            text = match.group(1).strip()
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        text = text[start:end]
    text = re.sub(r",\s*}", "}", text)
    text = re.sub(r",\s*]", "]", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    try:
        single = text.replace("'", '"')
        return json.loads(single)
    except json.JSONDecodeError:
        pass
    out = {}
    for key in ("type", "color", "style", "season", "formality"):
        m = re.search(rf'"{key}"\s*:\s*"([^"]*)"', text, re.IGNORECASE)
        if m:
            out[key] = m.group(1).strip()
    if out:
        return out
    raise ValueError("Gemini response could not be parsed as JSON")


def _parse_similar_indices_fallback(text: str) -> dict:
    """Extract similar_indices list from Gemini text when JSON parse fails."""
    def parse_numbers(inner: str) -> list[int]:
        indices = []
        for part in re.split(r"[,;\s]+", inner):
            part = part.strip().strip("[]")
            if not part:
                continue
            try:
                n = int(float(part))
                if n >= 1:
                    indices.append(n)
            except (ValueError, TypeError):
                continue
        return indices

    out: dict = {}
    match = re.search(r'"similar_indices"\s*:\s*\[([^\]]*)\]', text, re.IGNORECASE | re.DOTALL)
    if not match:
        match = re.search(r"similar_indices\s*:\s*\[([^\]]*)\]", text, re.IGNORECASE | re.DOTALL)
    if match:
        out["similar_indices"] = parse_numbers(match.group(1))
        return out
    match = re.search(r"\[\s*(\d[\d.,\s]*)\s*\]", text)
    if match:
        out["similar_indices"] = parse_numbers(match.group(1))
        return out
    out["similar_indices"] = []
    return out


def _resize_image_bytes(data: bytes, mime_type: str) -> tuple[bytes, str]:
    """Resize image to max _GEMINI_MAX_PX for optimal Gemini processing."""
    try:
        from PIL import Image
    except ImportError:
        return data, mime_type
    try:
        img = Image.open(io.BytesIO(data))
        img = img.convert("RGB")
        w, h = img.size
        # If already small enough and small file size, return as is
        if w <= _GEMINI_MAX_PX and h <= _GEMINI_MAX_PX and len(data) < 150_000:
            img.close()
            return data, mime_type
        if w >= h:
            new_w = _GEMINI_MAX_PX
            new_h = max(1, int(h * (new_w / w)))
        else:
            new_h = _GEMINI_MAX_PX
            new_w = max(1, int(w * (new_h / h)))
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        img.save(out, "JPEG", quality=_GEMINI_JPEG_QUALITY, optimize=True)
        img.close()
        return out.getvalue(), "image/jpeg"
    except Exception:
        return data, mime_type


def _coerce_value(key: str, val: str | None, valid_set: set[str], default: str) -> str:
    """Coerce value to valid set; return default if no match."""
    if not val or not isinstance(val, str):
        return default
    v = val.lower().strip()
    if v in valid_set:
        return v
    for opt in valid_set:
        if opt in v or v in opt:
            return opt
    return default


def classify_clothing(image_path: str | Path) -> dict:
    """
    Use Gemini 1.5 Pro to classify a clothing item with luxury-level precision.
    Uses native JSON mode and high resolution.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is not set")

    genai.configure(api_key=GEMINI_API_KEY)
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {path}")

    image_bytes = path.read_bytes()
    ext = path.suffix.lower()
    mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif"}
    mime_type = mime_map.get(ext, "image/jpeg")
    
    # Using higher resolution now for accuracy
    image_bytes, mime_type = _resize_image_bytes(image_bytes, mime_type)

    prompt = """You are a luxury fashion expert. Analyze the provided image of a clothing item with extreme precision.
Classify the item into a JSON object using the following categories and allowed values:

1. "type": (shirt, pants, dress, shoes, jacket, skirt, sweater, blouse, shorts, coat, hat, scarf, bag, accessory, other)
2. "color": (The specific primary color, e.g., 'champagne', 'navy', 'cream', 'charcoal')
3. "style": (casual, classy, streetwear, sporty, professional, bohemian, minimalist)
4. "season": (summer, winter, spring, fall, all-season)
5. "formality": (formal, semi-formal, casual, partywear)

### EXAMPLES:
- Input: Image of a sharp black blazer
- Output: {"type": "jacket", "color": "black", "style": "professional", "season": "all-season", "formality": "formal"}

- Input: Image of a flowy floral sundress
- Output: {"type": "dress", "color": "floral", "style": "bohemian", "season": "summer", "formality": "casual"}

Analyze the image carefully and return only the JSON."""

    model = genai.GenerativeModel(GEMINI_MODEL)
    
    # Use native JSON mode for 100% reliable structure
    response = model.generate_content(
        [
            {"inline_data": {"mime_type": mime_type, "data": image_bytes}},
            prompt,
        ],
        generation_config={
            "response_mime_type": "application/json",
            "max_output_tokens": 256
        },
    )

    if not response.candidates or not response.candidates[0].content.parts:
        raise ValueError("Gemini returned no response content")
    
    text = (response.text or "").strip()
    if not text:
        raise ValueError("Gemini returned empty text")

    try:
        raw = json.loads(text)
    except json.JSONDecodeError:
        raw = _parse_safe(text)

    return {
        "type": _coerce_value("type", raw.get("type"), VALID_TYPES, "other"),
        "color": (raw.get("color") or "unknown").strip()[:50] if isinstance(raw.get("color"), str) else "unknown",
        "style": _coerce_value("style", raw.get("style"), VALID_STYLES, "casual"),
        "season": _coerce_value("season", raw.get("season"), VALID_SEASONS, "all-season"),
        "formality": _coerce_value("formality", raw.get("formality"), VALID_FORMALITY, "casual"),
    }


def find_similar_in_wardrobe(
    query_image_path: str | Path,
    wardrobe_items: list[dict],
    uploads_dir: Path,
    max_wardrobe_images: int = 6,
) -> tuple[list[int], str | None]:
    """
    Compare a query clothing image to wardrobe item images using Gemini Vision.
    Returns (list of wardrobe item ids that look similar, raw_response_preview or None).
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is not set")

    genai.configure(api_key=GEMINI_API_KEY)
    query_path = Path(query_image_path)
    if not query_path.exists():
        raise FileNotFoundError(f"Query image not found: {query_path}")

    uploads_dir = Path(uploads_dir)
    valid: list[tuple[dict, Path]] = []
    for w in wardrobe_items:
        img_path = w.get("image_path")
        if not img_path or not isinstance(img_path, str) or img_path.startswith("demo/"):
            continue
        name = Path(img_path).name
        full = uploads_dir / name
        if not full.exists() and img_path.startswith("uploads/"):
            full = uploads_dir.parent / img_path
        if not full.exists():
            continue
        valid.append((w, full))

    if not valid:
        return [], "No items with photos to compare."

    valid = valid[:max_wardrobe_images]
    mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif"}

    query_bytes = query_path.read_bytes()
    q_ext = query_path.suffix.lower()
    q_mime = mime_map.get(q_ext, "image/jpeg")
    query_bytes, q_mime = _resize_image_bytes(query_bytes, q_mime)

    content_parts = [{"inline_data": {"mime_type": q_mime, "data": query_bytes}}]
    
    for _w, w_path in valid:
        w_bytes = w_path.read_bytes()
        w_ext = w_path.suffix.lower()
        w_mime = mime_map.get(w_ext, "image/jpeg")
        w_bytes, w_mime = _resize_image_bytes(w_bytes, w_mime)
        content_parts.append({"inline_data": {"mime_type": w_mime, "data": w_bytes}})

    max_idx = len(valid) + 1
    prompt = f'Look at the {max_idx} images above. Image 1 is the item the user is considering. Images 2 to {max_idx} are items in their wardrobe. Which wardrobe images show the SAME or VERY SIMILAR item as image 1? Reply with ONLY a JSON object: {{"similar_indices": [2]}}'
    content_parts.append(prompt)

    safety_settings = [
        {"category": HarmCategory.HARM_CATEGORY_HARASSMENT, "threshold": HarmBlockThreshold.BLOCK_NONE},
        {"category": HarmCategory.HARM_CATEGORY_HATE_SPEECH, "threshold": HarmBlockThreshold.BLOCK_NONE},
        {"category": HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, "threshold": HarmBlockThreshold.BLOCK_NONE},
        {"category": HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, "threshold": HarmBlockThreshold.BLOCK_NONE},
    ]

    model = genai.GenerativeModel(GEMINI_MODEL, safety_settings=safety_settings)
    response = model.generate_content(
        content_parts,
        generation_config={"response_mime_type": "application/json", "max_output_tokens": 256},
    )
    
    text = ""
    if response.candidates and response.candidates[0].content.parts:
        text = (response.text or "").strip()
    
    if not text:
        return [], None

    try:
        raw = json.loads(text)
    except json.JSONDecodeError:
        raw = _parse_similar_indices_fallback(text)
        
    indices_1based = raw.get("similar_indices", [])
    result_ids = []
    seen = set()
    for idx in indices_1based:
        try:
            i = int(idx)
            if 2 <= i <= max_idx and i not in seen:
                seen.add(i)
                result_ids.append(valid[i - 2][0]["id"])
        except (ValueError, TypeError):
            continue

    preview = (text[:400] + "...") if (not result_ids and text) else None
    return result_ids, preview
