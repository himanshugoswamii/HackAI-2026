"""SQLAlchemy models"""
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Integer(primary_key=True, autoincrement=True, index=True)
    age = Integer(nullable=False)
    gender = String(50, nullable=False)  # male, female, non-binary, etc.
    style_preference = String(100, nullable=True)  # Classy, Street wear, Professional, etc.
    created_at = DateTime(default=datetime.utcnow)


class WardrobeItem(Base):
    __tablename__ = "wardrobe_items"

    id = Integer(primary_key=True, autoincrement=True, index=True)
    user_id = Integer(ForeignKey("users.id"), nullable=False)
    image_url = String(500, nullable=False)  # path or URI
    attributes = JSON  # {"category": "shirt", "color": "blue", "pattern": "solid", ...}
    last_worn_at = DateTime(nullable=True)
    created_at = DateTime(default=datetime.utcnow)


class InspirationImage(Base):
    __tablename__ = "inspiration_images"

    id = Integer(primary_key=True, autoincrement=True, index=True)
    user_id = Integer(ForeignKey("users.id"), nullable=False)
    image_url = String(500, nullable=False)
    created_at = DateTime(default=datetime.utcnow)
