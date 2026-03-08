"""ChatbotAgent - answers general fashion questions using Gemini text model."""
from pydantic import BaseModel
import google.generativeai as genai
from config import GEMINI_API_KEY, GEMINI_MODEL

from pathlib import Path
from PIL import Image

class ChatMessage(BaseModel):
    role: str
    content: str
    image_path: str | None = None

class ChatbotAgent:
    """Answers general fashion questions from users."""

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or GEMINI_API_KEY
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY required for ChatbotAgent")

    def chat(self, messages: list[ChatMessage], wardrobe_items: list[dict] | None = None) -> str:
        """
        messages: [{"role": "user" | "assistant", "content": "hello", "image_path": "...uploads/..."}]
        wardrobe_items: user's current wardrobe for context
        Returns the generated reply text.
        """
        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        system_prompt = "You are a helpful, stylish AI personal fashion assistant. Answer the user's questions about fashion, outfits, and styling. Be supportive, trendy, and concise."
        if wardrobe_items:
            descriptions = []
            for item in wardrobe_items:
                color = item.get("color", "").strip()
                style = item.get("style", "").strip()
                typ = item.get("type", "").strip()
                desc = " ".join([p for p in (color, style, typ) if p]).lower()
                if desc:
                    descriptions.append(desc)
            if descriptions:
                wardrobe_text = ", ".join(descriptions)
                system_prompt += f" The user currently has the following items in their wardrobe: {wardrobe_text}."

        app_dir = Path(__file__).resolve().parent

        formatted_messages = []
        for msg in messages:
            # Multi-modal parts
            parts = [msg.content]
            if getattr(msg, 'image_path', None):
                try:
                    img_path = app_dir / msg.image_path
                    if img_path.exists():
                        img = Image.open(img_path)
                        img.load() # ensure loaded before yielding
                        parts.append(img)
                except Exception as e:
                    print(f"Error loading chat image {msg.image_path}: {e}")

            formatted_messages.append({
                "role": "user" if msg.role == "user" else "model",
                "parts": parts
            })

        # Prepend the system prompt as the first user message if it's not already set
        if formatted_messages and not formatted_messages[0]["parts"][0].startswith("System Rules:"):
            old_text = formatted_messages[0]["parts"][0]
            formatted_messages[0]["parts"] = [f"System Rules: {system_prompt}\n\nUser: {old_text}"]
        elif not formatted_messages:
            formatted_messages.append({"role": "user", "parts": [f"System Rules: {system_prompt}\n\nHello"]})

        response = model.generate_content(formatted_messages)
        if hasattr(response, 'text'):
            return response.text
        return "I'm sorry, I couldn't generate a response."
