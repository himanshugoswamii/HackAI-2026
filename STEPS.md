# Fix timeout – step by step

Do these in order. After each step, check the result before going to the next.

---

## Step 1: Start the API only

In a terminal:

```bash
cd /Users/himanshu8/Desktop/Projects/TidalHack/api
./venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Leave this running. You should see:

- `Uvicorn running on http://0.0.0.0:8000`
- No "address already in use" error

If you see "address already in use", run this first to free the port:

```bash
lsof -ti :8000 | xargs kill -9
```

Then run the uvicorn command again.

---

## Step 2: Check that the API responds

Open a **new** terminal (keep the API running in the first one).

Run:

```bash
curl http://localhost:8000/health
```

You should see: `{"status":"ok"}`

Then run:

```bash
curl http://localhost:8000/wardrobe/list
```

You should see a JSON array (e.g. `[]` or a list of items). This request should return in under a second.

If either command hangs or fails, the problem is with the API or the port. Fix that before using the website.

---

## Step 3: Start the web app

In a **second** terminal (API still running in the first):

```bash
cd /Users/himanshu8/Desktop/Projects/TidalHack/web
npm run dev
```

You should see: `Local: http://localhost:5173/`

---

## Step 4: Use the website

1. In your browser, open: **http://localhost:5173**
2. Click **Get started** → **Go to app**
3. You should see the **Wardrobe** tab (list or “Your wardrobe is empty”).

If the **first load** (wardrobe list) times out:

- The website is calling **http://localhost:8000**. If the API is not running or is on another machine/port, you get a timeout.
- Check again: in the browser, open **http://localhost:8000** – you should see JSON. If that fails, the API is not reachable from the browser.

If **upload** or **“Do I need this?”** times out:

- Those calls use Gemini and can take 15–90 seconds. The app will show “Request timed out after 90s” if they take too long.
- Make sure `api/.env` has a valid `GEMINI_API_KEY`. If the key is wrong or missing, the API can hang or error.

---

## Summary

| Step | What to do | Success check |
|------|------------|----------------|
| 1 | Start API: `cd api && ./venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000` | See "Uvicorn running" |
| 2 | Test API: `curl http://localhost:8000/health` and `curl http://localhost:8000/wardrobe/list` | Get JSON back quickly |
| 3 | Start web: `cd web && npm run dev` | See "Local: http://localhost:5173/" |
| 4 | Open http://localhost:5173 in browser | Wardrobe loads (or empty state) |

Timeouts usually mean: API not running, wrong URL/port, or a slow Gemini request (upload / similar-check). Steps 1–2 confirm the API is running and fast for simple requests.
