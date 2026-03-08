# Agent Stitch 🕵🏻‍♀️👗✨

**AI-Powered Personal Fashion Assistant** — A mobile app built with React Native (Expo) that helps you manage your wardrobe, get AI outfit suggestions, declutter unused clothing, and chat with a fashion-savvy AI.

## 📱 Features

### 👕 Smart Wardrobe
- Upload clothing items via **camera** or **photo gallery**
- AI-powered classification using **Google Gemini Vision** (auto-detects type, color, style, season, formality)
- Grid view of your entire wardrobe with **delete** support

### ✨ AI Stylist — *Miranda*
- Get personalized outfit recommendations based on your age, style preference, and current season
- Optionally describe an inspiration look and Miranda will match it from your wardrobe
- **Save** recommended outfits to your collection for future reference

### 📦 Declutter Agent — *Monica*
- Instantly identifies items you haven't worn recently
- Suggests your top 5 candidates for donation — no waiting, no loading

### 👗 Saved Outfits
- Browse all your saved outfit combinations
- Each outfit shows a **timestamp** so you know when you last saved it
- View item thumbnails for every recommendation

### 💬 Fashion Chatbot — *Ralph*
- Ask any fashion question and get AI-powered advice
- **Attach a photo** of a clothing item and ask *"What can I pair with this?"*
- Ralph uses your wardrobe data to give context-aware suggestions

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│              React Native (Expo) — ios-app/           │
│  Wardrobe │ Stylist │ Declutter │ Outfits │ Chatbot  │
└─────────────────────────┬────────────────────────────┘
                          │ REST API (via localtunnel)
┌─────────────────────────▼────────────────────────────┐
│                   FastAPI — api/                      │
│  /upload  │ /wardrobe/*  │ /stylist/*  │ /chatbot/*  │
└──┬────────────────┬──────────────┬───────────────────┘
   │ Gemini Vision   │ SQLite       │ Open-Meteo
   │ Gemini Text     │ (wardrobe)   │ (season)
   └─────────────────┴──────────────┘
```

- **Mobile App**: React Native + Expo in `ios-app/`
- **Backend**: FastAPI in `api/`
- **AI**: Google Gemini 2.5 Flash (Vision + Text)
- **Database**: SQLite

---

## 🚀 How to Run

### 1. Start the API Server

```bash
cd api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set your Gemini API key
export GEMINI_API_KEY=your_key   # or add to api/.env

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Expose the API via Tunnel (for mobile device access)

```bash
npx localtunnel --port 8000
```

Copy the tunnel URL and update `ios-app/src/api.js`:
```javascript
export const BASE_URL = 'https://your-tunnel-url.loca.lt';
```

### 3. Start the Mobile App

```bash
cd ios-app
npm install
npx expo start --tunnel
```

Scan the **QR code** with your iPhone camera (Expo Go) or Android.

---

## 📁 Project Structure

```
ios-app/                  # React Native (Expo) mobile app
  App.js                  # Tab navigator with emoji icons
  src/
    api.js                # Axios client (points to localtunnel)
    screens/
      LoginScreen.js      # Auth with AsyncStorage persistence
      WardrobeScreen.js   # Grid view + upload + delete
      StylistScreen.js    # Miranda — AI outfit suggestions
      DeclutterScreen.js  # Monica — donation suggestions
      OutfitsScreen.js    # Saved outfits with timestamps
      ChatbotScreen.js    # Ralph — AI chatbot with image support

api/                      # FastAPI backend
  main.py                 # All REST endpoints
  chatbot_agent.py        # Gemini multimodal chatbot
  stylist_agent.py        # Outfit recommendation engine
  gemini_service.py       # Gemini Vision classification
  database.py             # SQLite models (Wardrobe, SavedOutfit)
  weather_service.py      # Open-Meteo season detection
  config.py               # Environment config

web/                      # React (Vite) web app (legacy)
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload-clothing-image` | POST | Upload + AI classify clothing |
| `/wardrobe/list` | GET | List all wardrobe items |
| `/wardrobe/add` | POST | Add classified item |
| `/wardrobe/delete` | POST | Delete wardrobe item |
| `/wardrobe/declutter-suggestions` | GET | Top 5 unworn items |
| `/stylist/suggest-outfits` | POST | AI outfit recommendations |
| `/outfits/save` | POST | Save an outfit |
| `/outfits/list` | GET | List saved outfits |
| `/chatbot/chat` | POST | Fashion chatbot (text + image) |
| `/weather/season` | GET | Current season |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `GEMINI_MODEL` | ❌ | Model name (default: `gemini-2.5-flash`) |

Place in `api/.env`:
```
GEMINI_API_KEY=your_key_here
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native, Expo, React Navigation |
| Backend | Python, FastAPI, SQLAlchemy, SQLite |
| AI | Google Gemini 2.5 Flash (Vision + Text) |
| Image Handling | expo-image-picker, Pillow |
| Storage | AsyncStorage (client), SQLite (server) |
| Tunnel | localtunnel (dev) |

---

See [PITCH.md](PITCH.md) for the hackathon pitch.
