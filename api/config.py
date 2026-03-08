"""Configuration - use GEMINI_API_KEY env var (required for classification)."""
import os
import warnings
from pathlib import Path

# Suppress google.generativeai deprecation so startup logs stay clean (must be before any genai import)
warnings.filterwarnings("ignore", category=FutureWarning)

from dotenv import load_dotenv

# Load .env from api/ directory
_api_dir = Path(__file__).resolve().parent
_env_path = _api_dir / ".env"
load_dotenv(dotenv_path=_env_path)
# Also try loading from cwd (when running uvicorn from api/)
load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

# Model: set via GEMINI_MODEL in .env. gemini-2.5-pro = best quality (use with billing).
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"

# Sanity check: warn if key not loaded (helps debug)
if not GEMINI_API_KEY:
    import sys
    print(f"[config] GEMINI_API_KEY not set. Looked for .env at: {_env_path}", file=sys.stderr)
