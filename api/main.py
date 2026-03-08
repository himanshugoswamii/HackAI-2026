"""Minimal FastAPI backend - ready for DigitalOcean App Platform"""
import asyncio
import json
import uuid
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import GEMINI_API_KEY
from database import SavedOutfit, Wardrobe, SessionLocal, get_db, init_db
from declutter_agent import DeclutterAgent
from gemini_service import classify_clothing, find_similar_in_wardrobe
from stylist_agent import StylistAgent
from chatbot_agent import ChatbotAgent
from weather_service import get_current_season

app = FastAPI(title="API")


DEMO_WARDROBE = [
    {"type": "shirt", "color": "white", "style": "casual", "season": "all-season", "formality": "casual"},
    {"type": "pants", "color": "blue", "style": "casual", "season": "all-season", "formality": "casual"},
    {"type": "shirt", "color": "navy", "style": "professional", "season": "all-season", "formality": "semi-formal"},
    {"type": "jacket", "color": "black", "style": "classy", "season": "fall", "formality": "formal"},
    {"type": "shoes", "color": "white", "style": "sporty", "season": "summer", "formality": "casual"},
    {"type": "dress", "color": "black", "style": "classy", "season": "all-season", "formality": "formal"},
]


@app.on_event("startup")
def startup():
    init_db()
    _seed_demo_if_empty()


def _seed_demo_if_empty():
    db = SessionLocal()
    try:
        if db.query(Wardrobe).count() == 0:
            for item in DEMO_WARDROBE:
                w = Wardrobe(
                    type=item["type"],
                    color=item["color"],
                    style=item["style"],
                    season=item["season"],
                    formality=item["formality"],
                    image_path=f"demo/{item['color']}-{item['type']}",
                )
                db.add(w)
            db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


UPLOADS_DIR = Path(__file__).parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


# Smaller images = faster Gemini. Keep small so API responds quickly.
_CLASSIFY_MAX_PX = 400
_CLASSIFY_JPEG_QUALITY = 78


def _resize_for_classify(file_path: Path) -> Path:
    """Resize image to max 400px so Gemini is fast. Returns path to use (maybe a temp file)."""
    try:
        from PIL import Image
    except ImportError:
        return file_path
    try:
        img = Image.open(file_path)
        img = img.convert("RGB")
        w, h = img.size
        if w <= _CLASSIFY_MAX_PX and h <= _CLASSIFY_MAX_PX:
            img.close()
            return file_path
        if w >= h:
            new_w = _CLASSIFY_MAX_PX
            new_h = max(1, int(h * (new_w / w)))
        else:
            new_h = _CLASSIFY_MAX_PX
            new_w = max(1, int(w * (new_h / h)))
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        out = file_path.parent / f"_classify_{file_path.stem}.jpg"
        img.save(out, "JPEG", quality=_CLASSIFY_JPEG_QUALITY, optimize=True)
        img.close()
        return out
    except Exception:
        return file_path


ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class WardrobeAdd(BaseModel):
    type: str
    color: str
    style: str
    season: str
    formality: str
    image_path: str


class SuggestOutfitsRequest(BaseModel):
    age: int
    style_preference: str
    wardrobe_items: list[dict]
    season: str | None = None
    inspiration_description: str | None = None


class SaveOutfitRequest(BaseModel):
    title: str
    items: list[str]
    reason: str = ""
    item_images: list[dict] | None = None  # [{label, image_path}, ...]


class ChatMessage(BaseModel):
    role: str
    content: str
    image_path: str | None = None

class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@app.get("/weather/season")
def weather_season(lat: float = 40.7128, lon: float = -74.0060):
    """Get current season from lightweight Open-Meteo weather API (no key required)."""
    return {"season": get_current_season(lat, lon)}


@app.get("/")
def root():
    """Identify this server. If you see this, the frontend should use this API (port 8000)."""
    return {
        "app": "Neural Threads API (api/)",
        "message": "Use this server for the web frontend (web/). Do NOT run backend/ on 8000.",
        "routes": {
            "health": "GET /health",
            "ready": "GET /ready",
            "wardrobe_list": "GET /wardrobe/list",
            "wardrobe_similar_check": "GET/POST /wardrobe/similar-check",
            "outfits_list": "GET /outfits/list",
            "outfits_save": "POST /outfits/save",
            "upload": "POST /upload-clothing-image",
            "chatbot_chat": "POST /chatbot/chat",
        },
    }


@app.get("/health")
async def health():
    """Simple liveness check. Returns 200 when the app is up."""
    return {"status": "ok"}


@app.get("/ready")
async def ready():
    """Readiness: app + DB. Use for load balancers or run scripts."""
    from sqlalchemy import text
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready"}
    finally:
        db.close()


@app.get("/favicon.ico")
async def favicon():
    """Avoid 404 when browser requests favicon from API."""
    return Response(status_code=204)


@app.get("/uploads/{filename}")
def serve_upload(filename: str):
    """Serve uploaded images. Reject path traversal (e.g. ../../../etc/passwd)."""
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(400, "Invalid filename")
    file_path = (UPLOADS_DIR / filename).resolve()
    try:
        file_path.relative_to(UPLOADS_DIR.resolve())
    except ValueError:
        raise HTTPException(404, "Image not found")
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(404, "Image not found")
    ext = file_path.suffix.lower()
    media_type = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp", "gif": "image/gif"}.get(ext.lstrip("."), "image/jpeg")
    return FileResponse(file_path, media_type=media_type)


@app.post("/upload-clothing-image")
async def upload_clothing_image(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(400, "No filename provided")
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(400, f"Invalid file type. Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB")

    ext = Path(file.filename).suffix.lower() or ".jpg"
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        ext = ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOADS_DIR / unique_name

    file_path.write_bytes(contents)

    classification = None
    if GEMINI_API_KEY:
        path_for_gemini = _resize_for_classify(file_path)
        try:
            classification = await asyncio.to_thread(classify_clothing, path_for_gemini)
        except Exception as e:
            raise HTTPException(503, f"Classification failed: {str(e)}")
        finally:
            if path_for_gemini != file_path and path_for_gemini.exists():
                path_for_gemini.unlink(missing_ok=True)
    else:
        raise HTTPException(503, "GEMINI_API_KEY not configured; classification unavailable")

    return {
        "image_path": f"uploads/{unique_name}",
        "message": "uploaded successfully",
        "classification": classification,
    }


@app.post("/wardrobe/add")
def wardrobe_add(body: WardrobeAdd, db: Session = Depends(get_db)):
    item = Wardrobe(
        type=body.type,
        color=body.color,
        style=body.style,
        season=body.season,
        formality=body.formality,
        image_path=body.image_path,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        "id": item.id,
        "type": item.type,
        "color": item.color,
        "style": item.style,
        "season": item.season,
        "formality": item.formality,
        "image_path": item.image_path,
        "last_worn": item.last_worn.isoformat() if item.last_worn else None,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


@app.post("/stylist/suggest-outfits")
def suggest_outfits(
    body: SuggestOutfitsRequest,
    lat: float = 40.7128,
    lon: float = -74.0060,
):
    if not GEMINI_API_KEY:
        raise HTTPException(503, "GEMINI_API_KEY not configured")
    season = body.season or get_current_season(lat, lon)
    try:
        agent = StylistAgent()
        return agent.suggest(
            age=body.age,
            style_preference=body.style_preference,
            season=season,
            wardrobe_items=body.wardrobe_items,
            inspiration_description=body.inspiration_description,
        )
    except Exception as e:
        raise HTTPException(503, f"Stylist suggestion failed: {str(e)}")


def _image_paths_from_saved_outfits(db: Session, last_n: int = 3) -> set[str]:
    """Return set of image path basenames used in the last N saved outfits (for declutter logic)."""
    rows = (
        db.query(SavedOutfit)
        .order_by(SavedOutfit.created_at.desc())
        .limit(last_n)
        .all()
    )
    used_basenames: set[str] = set()
    for row in rows:
        try:
            item_images = json.loads(row.item_images_json) if row.item_images_json else []
        except (json.JSONDecodeError, TypeError):
            continue
        for img in item_images:
            if isinstance(img, dict) and img.get("image_path"):
                p = img.get("image_path", "")
                if isinstance(p, str) and p.strip():
                    used_basenames.add(Path(p).name.strip())
    return used_basenames


@app.get("/wardrobe/declutter-suggestions")
def declutter_suggestions(
    db: Session = Depends(get_db),
):
    """Instant declutter: return top 5 items not worn recently. No AI, no weather API."""
    from datetime import datetime, timedelta, timezone

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    items = db.query(Wardrobe).all()

    candidates = []
    for i in items:
        # Include if never worn OR worn before cutoff
        if i.last_worn is not None and i.last_worn > cutoff:
            continue
        candidates.append(i)

    # Limit to 5
    candidates = candidates[:5]

    suggestions = []
    for i in candidates:
        suggestions.append({
            "id": i.id,
            "type": i.type,
            "color": i.color,
            "style": i.style,
            "season": i.season,
            "formality": i.formality,
            "image_path": i.image_path,
            "reason": "You haven't worn this item recently — consider donating it!",
        })

    return {"suggestions": suggestions}


@app.post("/outfits/save")
def outfits_save(body: SaveOutfitRequest, db: Session = Depends(get_db)):
    """Save a chosen outfit to the Outfits folder (DB)."""
    item_images = body.item_images if isinstance(body.item_images, list) else []
    record = SavedOutfit(
        title=body.title[:200],
        items_json=json.dumps(body.items),
        item_images_json=json.dumps(item_images),
        reason=(body.reason or "")[:2000],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {
        "id": record.id,
        "title": record.title,
        "items": body.items,
        "item_images": item_images,
        "reason": record.reason,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }


@app.get("/outfits/list")
def outfits_list(db: Session = Depends(get_db)):
    """List all saved outfits (newest first)."""
    rows = db.query(SavedOutfit).order_by(SavedOutfit.created_at.desc()).all()
    out = []
    for r in rows:
        try:
            items = json.loads(r.items_json) if r.items_json else []
        except (json.JSONDecodeError, TypeError):
            items = []
        try:
            item_images = json.loads(r.item_images_json) if r.item_images_json else []
        except (json.JSONDecodeError, TypeError):
            item_images = []
        out.append({
            "id": r.id,
            "title": r.title,
            "items": items,
            "item_images": item_images,
            "reason": r.reason or "",
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return {"outfits": out}


class WardrobeDelete(BaseModel):
    id: int


@app.post("/wardrobe/delete")
def wardrobe_delete(body: WardrobeDelete, db: Session = Depends(get_db)):
    """Delete a wardrobe item. Removed items are excluded from Stylist and Declutter."""
    item_id = body.id
    item = db.query(Wardrobe).filter(Wardrobe.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    db.delete(item)
    db.commit()
    return {"deleted": True, "id": item_id}


@app.post("/wardrobe/seed")
def wardrobe_seed(db: Session = Depends(get_db)):
    """Seed demo wardrobe items if empty."""
    if db.query(Wardrobe).count() > 0:
        return {"message": "Wardrobe already has items", "seeded": False}
    for item in DEMO_WARDROBE:
        w = Wardrobe(
            type=item["type"],
            color=item["color"],
            style=item["style"],
            season=item["season"],
            formality=item["formality"],
            image_path=f"demo/{item['color']}-{item['type']}",
        )
        db.add(w)
    db.commit()
    return {"message": "Demo wardrobe seeded", "seeded": True}


@app.get("/wardrobe/list")
def wardrobe_list(db: Session = Depends(get_db)):
    items = db.query(Wardrobe).order_by(Wardrobe.created_at.desc()).all()
    return [
        {
            "id": i.id,
            "type": i.type,
            "color": i.color,
            "style": i.style,
            "season": i.season,
            "formality": i.formality,
            "image_path": i.image_path,
            "last_worn": i.last_worn.isoformat() if i.last_worn else None,
            "created_at": i.created_at.isoformat() if i.created_at else None,
        }
        for i in items
    ]


@app.get("/wardrobe/similar-check")
def wardrobe_similar_check_get():
    return {"message": "Do I need this? API is available. Use POST with form field 'file' (image) to check similar items."}


@app.post("/wardrobe/similar-check")
async def wardrobe_similar_check(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a clothing image; return similar items already in the wardrobe (Gemini Vision)."""
    if not file.filename:
        raise HTTPException(400, "No filename provided")
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(400, "Invalid file type")
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large. Max {MAX_FILE_SIZE // (1024*1024)}MB")
    if not GEMINI_API_KEY:
        raise HTTPException(503, "GEMINI_API_KEY not configured")
    ext = Path(file.filename).suffix.lower() or ".jpg"
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        ext = ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    query_path = UPLOADS_DIR / unique_name
    query_path.write_bytes(contents)
    path_for_gemini = _resize_for_classify(query_path)
    try:
        items = db.query(Wardrobe).order_by(Wardrobe.created_at.desc()).all()
        wardrobe = [
            {
                "id": i.id,
                "type": i.type,
                "color": i.color,
                "style": i.style,
                "season": i.season,
                "formality": i.formality,
                "image_path": i.image_path,
            }
            for i in items
        ]
        similar_ids, response_preview = await asyncio.to_thread(
            find_similar_in_wardrobe, path_for_gemini, wardrobe, UPLOADS_DIR, 10
        )
        similar = [
            {
                "id": i.id,
                "type": i.type,
                "color": i.color,
                "style": i.style,
                "season": i.season,
                "formality": i.formality,
                "image_path": i.image_path,
                "last_worn": i.last_worn.isoformat() if i.last_worn else None,
                "created_at": i.created_at.isoformat() if i.created_at else None,
            }
            for i in items
            if i.id in similar_ids
        ]
        out = {"similar_items": similar, "count": len(similar)}
        if len(similar) == 0 and response_preview:
            out["response_preview"] = response_preview  # what Gemini returned (to debug 0 similar)
        return out
    except ValueError as e:
        if "No wardrobe items" in str(e):
            raise HTTPException(400, str(e))
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(503, str(e))
    finally:
        if path_for_gemini != query_path and path_for_gemini.exists():
            path_for_gemini.unlink(missing_ok=True)
        if query_path.exists():
            query_path.unlink(missing_ok=True)


# Also under /api/wardrobe/ so frontend can use either base path
@app.get("/api/wardrobe/similar-check")
def api_wardrobe_similar_check_get():
    return {"message": "Do I need this? API is available. Use POST with form field 'file' (image) to check similar items."}


@app.post("/api/wardrobe/similar-check")
async def api_wardrobe_similar_check_post(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Same as POST /wardrobe/similar-check."""
    return await wardrobe_similar_check(file, db)


@app.post("/chatbot/chat")
def chatbot_chat(body: ChatRequest, db: Session = Depends(get_db)):
    if not GEMINI_API_KEY:
        raise HTTPException(503, "GEMINI_API_KEY not configured")
    try:
        items = db.query(Wardrobe).all()
        wardrobe = [
            {"type": i.type, "color": i.color, "style": i.style, "season": i.season}
            for i in items
        ]
        agent = ChatbotAgent()
        reply = agent.chat(body.messages, wardrobe_items=wardrobe)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(503, f"Chatbot failed: {str(e)}")


@app.exception_handler(404)
async def not_found(request: Request, exc):
    """Return JSON for 404 so you can see which path was not found."""
    return JSONResponse(
        status_code=404,
        content={"detail": "Not found", "path": str(request.url.path), "method": request.method},
    )
