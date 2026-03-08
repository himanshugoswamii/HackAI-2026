# DigitalOcean App Platform Deployment

## Prerequisites

- DigitalOcean account
- GitHub repo with `api/` folder (or repo root = api)
- GEMINI_API_KEY from https://aistudio.google.com/apikey

---

## Step-by-step deployment

### 1. Push code to GitHub

```bash
# From TidalHack root
git add .
git commit -m "Add API for deployment"
git push origin main
```

### 2. Create App on DigitalOcean

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **Create App**
3. Choose **GitHub** as source
4. Authorize DigitalOcean → select your repo
5. Select branch (e.g. `main`)

### 3. Configure build

If deploying from monorepo root (`TidalHack/`):

| Setting | Value |
|---------|-------|
| **Source Directory** | `api` |
| **Build Command** | `pip install -r requirements.txt` |
| **Run Command** | `uvicorn main:app --host 0.0.0.0 --port 8080` |

If `api/` is the repo root:

| Setting | Value |
|---------|-------|
| **Build Command** | `pip install -r requirements.txt` |
| **Run Command** | `uvicorn main:app --host 0.0.0.0 --port 8080` |

Or use Procfile (auto-detected): `web: uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}`

### 4. Add environment variable

1. In App spec → **Environment Variables** (or Settings → App-Level Env Vars)
2. Add:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: your API key (mark as **Encrypted** if offered)
3. Save

### 5. Configure HTTP service

- **HTTP Port**: `8080` (or leave default; App Platform sets `PORT`)
- **HTTP Routes**: `/` (catch-all)

### 6. Deploy

1. Click **Create Resources** or **Deploy**
2. Wait for build and deploy (3–5 min)
3. Copy the public URL (e.g. `https://your-app-xxxxx.ondigitalocean.app`)

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for classification and agents |
| `PORT` | No | Set by App Platform (default 8080) |

---

## Public URL testing steps

### 1. Health check

```bash
curl https://YOUR_APP_URL/health
```

Expected: `{"status":"ok"}`

### 2. Weather / season

```bash
curl "https://YOUR_APP_URL/weather/season?lat=40.71&lon=-74.01"
```

Expected: `{"season":"summer"}` (or winter/spring/fall)

### 3. Wardrobe list

```bash
curl https://YOUR_APP_URL/wardrobe/list
```

Expected: `[]` (empty array) or list of items

### 4. Upload clothing image (multipart)

```bash
curl -X POST https://YOUR_APP_URL/upload-clothing-image \
  -F "file=@/path/to/your/photo.jpg"
```

Expected: JSON with `image_path`, `message`, `classification` (requires GEMINI_API_KEY)

### 5. Stylist suggest outfits

```bash
curl -X POST "https://YOUR_APP_URL/stylist/suggest-outfits?lat=40.71&lon=-74.01" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 25,
    "style_preference": "casual",
    "wardrobe_items": [{"type":"shirt","color":"blue","style":"casual","season":"all-season","formality":"casual"}]
  }'
```

Expected: `{"outfits":[{"title":"...","items":[...],"reason":"..."}]}`

### 6. Declutter suggestions

```bash
curl "https://YOUR_APP_URL/wardrobe/declutter-suggestions?lat=40.71&lon=-74.01"
```

Expected: `{"suggestions":[...]}`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 503 on upload/classify | Ensure `GEMINI_API_KEY` is set |
| Connection refused | Verify `PORT` binding (use 8080 or `$PORT`) |
| Build fails | Check Source Directory = `api` if monorepo |
| CORS errors | CORS allows `*`; verify frontend URL if restricting |

---

## Update frontend API URL

In `frontend/src/api.ts`:

```ts
const API_BASE = 'https://YOUR_APP_URL';  // no trailing slash
```
