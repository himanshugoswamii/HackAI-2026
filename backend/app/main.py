"""Neural Threads API - AI Personal Stylist Backend"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import wardrobe, stylist, declutter, user, weather
from app.database import init_db


async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Neural Threads API",
    description="AI Personal Stylist - Miranda & Monica",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Hackathon: allow all; restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(wardrobe.router, prefix="/api/wardrobe", tags=["Wardrobe"])
app.include_router(stylist.router, prefix="/api/stylist", tags=["Miranda - Stylist"])
app.include_router(declutter.router, prefix="/api/declutter", tags=["Monica - Declutter"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])


@app.get("/health")
async def health():
    return {"status": "ok", "app": "neural-threads"}
