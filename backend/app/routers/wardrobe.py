"""Wardrobe API - upload & classify clothing"""
import base64
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import WardrobeItem, InspirationImage
from app.schemas import WardrobeItemResponse
from app.services.gemini_service import classify_clothing

router = APIRouter()


@router.post("/items", response_model=WardrobeItemResponse)
async def add_wardrobe_item(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload clothing photo; Gemini Vision classifies attributes."""
    contents = await file.read()
    if len(contents) > 5_000_000:  # 5MB
        raise HTTPException(400, "Image too large")
    
    # Store path - for MVP we use base64 in DB; upgrade to S3/cloud storage later
    image_b64 = base64.b64encode(contents).decode()
    mime = file.content_type or "image/jpeg"
    
    try:
        attributes = classify_clothing(image_b64, mime)
    except Exception as e:
        raise HTTPException(500, f"Classification failed: {str(e)}")
    
    item = WardrobeItem(
        user_id=user_id,
        image_url=f"data:{mime};base64,{image_b64[:200]}...",  # Store truncated for MVP
        attributes=attributes,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


@router.post("/items/base64", response_model=WardrobeItemResponse)
async def add_wardrobe_item_base64(
    user_id: int = Form(...),
    image_base64: str = Form(...),
    mime_type: str = Form("image/jpeg"),
    db: AsyncSession = Depends(get_db),
):
    """Add wardrobe item from base64 (for React Native image picker)."""
    try:
        attributes = classify_clothing(image_base64, mime_type)
    except Exception as e:
        raise HTTPException(500, f"Classification failed: {str(e)}")
    
    item = WardrobeItem(
        user_id=user_id,
        image_url=f"data:{mime_type};base64,{image_base64[:100]}...",
        attributes=attributes,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


@router.get("/items/{user_id}")
async def get_wardrobe(user_id: int, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(WardrobeItem).where(WardrobeItem.user_id == user_id))
    items = r.scalars().all()
    return [
        {
            "id": i.id,
            "image_url": i.image_url,
            "attributes": i.attributes,
            "last_worn_at": i.last_worn_at,
            "created_at": i.created_at,
        }
        for i in items
    ]


@router.post("/inspiration")
async def add_inspiration_image(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload Pinterest-like inspiration image."""
    contents = await file.read()
    image_b64 = base64.b64encode(contents).decode()
    insp = InspirationImage(
        user_id=user_id,
        image_url=f"data:{file.content_type or 'image/jpeg'};base64,{image_b64[:100]}...",
    )
    db.add(insp)
    await db.flush()
    return {"id": insp.id, "status": "ok"}


@router.post("/inspiration/base64")
async def add_inspiration_base64(
    user_id: int = Form(...),
    image_base64: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    insp = InspirationImage(
        user_id=user_id,
        image_url=f"data:image/jpeg;base64,{image_base64[:100]}...",
    )
    db.add(insp)
    await db.flush()
    return {"id": insp.id, "status": "ok"}
