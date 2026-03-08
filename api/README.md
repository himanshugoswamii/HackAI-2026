# API

Minimal FastAPI backend for DigitalOcean App Platform.

## Deployment

See [DEPLOY.md](DEPLOY.md) for step-by-step DigitalOcean App Platform deployment, env vars, and public URL testing.

## Setup (local)

```bash
# Virtualenv
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install
pip install -r requirements.txt

# API key (required for classification)
export GEMINI_API_KEY=your_key   # Get from https://aistudio.google.com/apikey

# Run
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /health` → `{"status": "ok"}`
- `POST /upload-clothing-image` — multipart file upload; returns `image_path`, `message`, `classification` (Gemini Vision)
- `POST /wardrobe/add` — add item: `{ type, color, style, season, formality, image_path }`
- `GET /wardrobe/list` — list all wardrobe items (SQLite, persists across restarts)
- `GET /wardrobe/declutter-suggestions?lat=&lon=` — items to donate (last_worn > 180 days + season mismatch); season from weather API; Gemini explanation per item
- `GET /weather/season?lat=&lon=` — current season from Open-Meteo (no key)
- `POST /stylist/suggest-outfits?lat=&lon=` — `{ age, style_preference, wardrobe_items, season?, inspiration_description? }` → outfits; season optional (fetched from weather if omitted)
- `GET /wardrobe/similar-check` — returns a message; use to verify this API is running (frontend expects **this** server, not `backend/`).
- `POST /wardrobe/similar-check` — multipart file upload (image); returns `{ similar_items, count }` (Gemini compares to wardrobe images).
- `uploads/` folder for image storage

**If you get 404 on "Do I need this?":** Ensure you're running **this** API (`uvicorn main:app --port 8000` from the `api/` directory). The app has two backends; the frontend talks to this one (routes at `/wardrobe/...`, no `/api` prefix). Open http://localhost:8000/wardrobe/similar-check in the browser—you should see a JSON message, not 404.
