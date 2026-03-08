"""Pydantic schemas"""
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class UserCreate(BaseModel):
    age: int
    gender: str
    style_preference: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    age: int
    gender: str
    style_preference: Optional[str] = None
    created_at: datetime


class WardrobeItemCreate(BaseModel):
    user_id: int
    image_url: str


class WardrobeItemResponse(BaseModel):
    id: int
    user_id: int
    image_url: str
    attributes: Optional[dict] = None
    last_worn_at: Optional[datetime] = None
    created_at: datetime


class InspirationImageCreate(BaseModel):
    user_id: int
    image_url: str


class OutfitRequest(BaseModel):
    user_id: int
    occasion: Optional[str] = None  # e.g., "work", "casual", "date"


class OutfitResponse(BaseModel):
    outfit_ids: list[int]
    explanation: str


class DeclutterRequest(BaseModel):
    user_id: int


class DeclutterResponse(BaseModel):
    item_ids: list[int]
    explanation: str
