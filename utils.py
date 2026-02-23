import os
import json
import logging
from functools import lru_cache

from werkzeug.utils import secure_filename

# ---------------------------------------------------------------------------
# Locale helpers
# ---------------------------------------------------------------------------

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
LOCALES_DIR = os.path.join(PROJECT_ROOT, "frontend", "public", "locales")
SUPPORTED_LANGUAGES = ("en", "hu")


@lru_cache(maxsize=None)
def load_locale(language: str) -> dict:
    """Load the locale dictionary for the requested language."""
    if language not in SUPPORTED_LANGUAGES:
        language = "en"

    path = os.path.join(LOCALES_DIR, f"{language}.json")
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        if language != "en":
            load_locale.cache_clear()
            return load_locale("en")  # pragma: no cover
        return {}


def get_translation_for_language(language: str, key: str, default: str | None = None):
    """Return a translated string for the dotted key in the given language."""

    def _walk(payload: dict, parts: list[str]):
        value = payload
        for segment in parts:
            if isinstance(value, dict) and segment in value:
                value = value[segment]
            else:
                return None
        return value

    parts = key.split(".")
    translation = _walk(load_locale(language), parts)
    if translation is None and language != "en":
        translation = _walk(load_locale("en"), parts)
    return translation if translation is not None else default


def get_language_options(language: str) -> dict[str, str]:
    """Return the menu labels for the available languages."""
    locale = load_locale(language)
    options = locale.get("language", {}).get("options", {})
    # Fallback to English copy if missing
    if not options:
        options = load_locale("en").get("language", {}).get("options", {})
    return options


# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'tif', 'txt'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_type(filename):
    """Determine file type category"""
    if not filename:
        return 'unknown'
    
    extension = filename.rsplit('.', 1)[1].lower()
    
    if extension == 'pdf':
        return 'pdf'
    elif extension == 'docx':
        return 'docx'
    elif extension == 'txt':
        return 'txt'
    elif extension in {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'tif'}:
        return 'image'
    else:
        return 'unknown'

def format_file_size(size_bytes):
    """Format file size in human readable format"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"

def truncate_text(text, max_length=100):
    """Truncate text to specified length"""
    if not text:
        return ""
    
    if len(text) <= max_length:
        return text
    
    return text[:max_length-3] + "..."

def validate_api_key(api_key):
    """Basic validation for API key format"""
    if not api_key:
        return False
    
    # OpenAI API keys typically start with 'sk-'
    if not api_key.startswith('sk-'):
        return False
    
    # Should be at least 20 characters long
    if len(api_key) < 20:
        return False
    
    return True

def safe_filename(filename):
    """Generate safe filename with timestamp"""
    from datetime import datetime
    secure_name = secure_filename(filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
    return timestamp + secure_name

def log_user_action(user_id, action, details=None):
    """Log user actions for audit trail"""
    logging.info(f"User {user_id} - {action}" + (f" - {details}" if details else ""))
