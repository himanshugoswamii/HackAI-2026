# Neural Threads

AI Personal Stylist — upload clothes, get outfit suggestions, and declutter with AI. **Web app only** (no mobile app).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React (Vite) — web/                          │
│  Wardrobe │ Stylist ("What should I wear?") │ Declutter │ Upload │ Do I need this?
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API (proxy in dev)
┌───────────────────────────▼─────────────────────────────────────┐
│                      FastAPI (api/)                              │
│  /upload-clothing-image  │ /wardrobe/*  │ /stylist/*  │ /weather │
└──┬──────────────────────┬──────────────────┬────────────────────┘
   │  Gemini Vision        │  SQLite           │  Open-Meteo
   │  (classify + similar) │  (wardrobe)       │  (season)
   │  Gemini Text (Stylist + Declutter)
   └──────────────────────┴──────────────────┘
```

- **Frontend**: React (Vite) in **web/** — website only, deployable as static build.
- **Backend**: FastAPI in **api/** — upload, classify, wardrobe, stylist, declutter.
- **AI**: Google Gemini (Vision + Text).
- **DB**: SQLite.

---

## How to run locally

**Option A – One command:** From project root run `./run.sh` (frees ports 8000/5173, starts API + web). Open http://localhost:5173. Ctrl+C stops both.

**Option B – Two terminals:**

**1. Start the API (port 8000)**

```bash
cd api
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Required for classification + AI
export GEMINI_API_KEY=your_key   # or put in api/.env

uvicorn main:app --host 0.0.0.0 --port 8000
```

**2. Start the web app (port 5173)**

```bash
cd web
npm install
npm run dev
```

Open **http://localhost:5173**. The dev server proxies API requests to `http://localhost:8000`, so the wardrobe, upload, stylist, declutter, and “Do I need this?” flows all work against your local API.

---

## Deploy as a website

- **Backend**: Deploy **api/** to any host that runs Python (e.g. DigitalOcean App Platform, Railway, Render). Set `GEMINI_API_KEY`. See `api/DEPLOY.md`.
- **Frontend**: Build the web app and host the static files:
  ```bash
  cd web
  npm run build
  ```
  Upload the **web/dist** folder to Vercel, Netlify, or any static host. Set the env var **VITE_API_BASE** to your deployed API URL (e.g. `https://your-api.ondigitalocean.app`) so the site calls your API in production.

---

## Troubleshooting

**"Request timed out" / upload or wardrobe not working**

1. **Start the API first.** In a terminal: `cd api && ./venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000`
2. **Check it’s running:** Open **http://localhost:8000** in the browser. You must see JSON like `{"app": "Neural Threads API (api/)", ...}`. If you don’t, the API isn’t running — nothing will work until it is.
3. **Then** start the web app: `cd web && npm run dev` and use **http://localhost:5173**.

**Wardrobe / upload / 404 / timeouts**  
The web app calls **http://localhost:8000** directly. If the API isn’t running on port 8000, you’ll get timeouts or connection errors. Only **api/** should run on 8000 (not **backend/**).

**GEMINI_API_KEY**  
Put your key in **api/.env**: one line, `GEMINI_API_KEY=your_key` (no quotes). Restart the API after changing.

---

## Project structure

```
api/              # FastAPI backend (port 8000)
  main.py, gemini_service.py, stylist_agent.py, declutter_agent.py
  database.py, weather_service.py

web/              # React (Vite) website — use this
  src/pages/      # Welcome, Wardrobe, Upload, Stylist, Declutter, Do I need this?
  src/api.ts      # API client

frontend/         # (Deprecated) Old Expo app — not used for web deploy
```

---

## Endpoints (api/)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/upload-clothing-image` | POST | Upload + classify clothing |
| `/wardrobe/list` | GET | List wardrobe |
| `/wardrobe/add` | POST | Add item |
| `/wardrobe/seed` | POST | Seed demo wardrobe |
| `/wardrobe/delete` | POST | Delete item |
| `/wardrobe/declutter-suggestions` | GET | Items to donate |
| `/wardrobe/similar-check` | POST | “Do I need this?” similar check |
| `/stylist/suggest-outfits` | POST | Outfit suggestions |
| `/weather/season` | GET | Current season |

See [PITCH.md](PITCH.md) for the hackathon pitch.
