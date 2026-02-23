import os
import json
import logging
import secrets
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from flask import Flask, g, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import inspect, text
from werkzeug.middleware.proxy_fix import ProxyFix

from utils import (
    SUPPORTED_LANGUAGES,
    get_language_options,
    get_translation_for_language,
    load_locale,
)
from flask_login import current_user

# Configure logging
logging.basicConfig(level=logging.DEBUG)


def _load_env_file(path: str = ".env") -> None:
    """Populate ``os.environ`` with values defined in a .env file if present."""

    if not path:
        return

    try:
        with open(path, "r", encoding="utf-8") as handle:
            for raw_line in handle:
                line = raw_line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                if not key or key in os.environ:
                    continue
                cleaned = value.strip().strip('"').strip("'")
                os.environ[key] = cleaned
    except FileNotFoundError:
        logging.debug(".env file not found at %s; skipping load", path)
    except OSError as exc:  # noqa: BLE001
        logging.warning("Unable to load .env file %s: %s", path, exc)


_load_env_file()

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

UTC = ZoneInfo("UTC")
BUDAPEST = ZoneInfo("Europe/Budapest")

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)  # needed for url_for to generate with https

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///contra.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Configure file uploads
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Initialize extensions
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'

# Create upload directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Add custom template filter for JSON parsing
@app.template_filter('from_json')
def from_json_filter(value):
    """Parse JSON string to Python object"""
    if not value:
        return []
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return []


@app.template_filter('format_budapest_time')
def format_budapest_time(value, fmt="%Y-%m-%d %H:%M"):
    """Format datetimes in Europe/Budapest time."""
    if not value:
        return ""
    if not isinstance(value, datetime):
        return ""
    aware = value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
    local_time = aware.astimezone(BUDAPEST)
    return local_time.strftime(fmt)

@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))

def resolve_language() -> str:
    """Return the preferred language using DB → cookie → Accept-Language → en."""

    if current_user.is_authenticated and current_user.language in SUPPORTED_LANGUAGES:
        return current_user.language

    cookie_lang = request.cookies.get("lang")
    if cookie_lang in SUPPORTED_LANGUAGES:
        return cookie_lang

    best_match = request.accept_languages.best_match(SUPPORTED_LANGUAGES)
    return best_match or "en"


@app.before_request
def _set_language_context():
    g.current_language = resolve_language()


@app.after_request
def _persist_language_cookie(response):
    language = getattr(g, "current_language", "en")
    if request.cookies.get("lang") != language:
        response.set_cookie(
            "lang",
            language,
            max_age=int(timedelta(days=365).total_seconds()),
            samesite="Lax",
        )
    response.headers["Content-Language"] = language
    return response




@app.route("/health", methods=["GET"])
def health_check():
    return {"ok": True}


@app.after_request
def _apply_optional_cors(response):
    frontend_origin = (os.environ.get("FRONTEND_ORIGIN") or "").strip()
    if frontend_origin and request.path.startswith("/api/"):
        response.headers["Access-Control-Allow-Origin"] = frontend_origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
        response.headers.setdefault("Vary", "Origin")
    return response

@app.context_processor
def inject_locale_helpers():
    language = getattr(g, "current_language", "en")
    locale_messages = load_locale(language)

    def _csrf_token() -> str:
        token = session.get("_csrf_token")
        if not token:
            token = secrets.token_urlsafe(32)
            session["_csrf_token"] = token
        return token

    def _translate(key: str, default: str | None = None, **kwargs):
        text = get_translation_for_language(language, key, default)
        if isinstance(text, str) and kwargs:
            try:
                return text.format(**kwargs)
            except (KeyError, IndexError, ValueError):
                return text
        return text

    return {
        "locale": language,
        "translations": locale_messages,
        "t": _translate,
        "language_options": get_language_options(language),
        "supported_languages": SUPPORTED_LANGUAGES,
        "csrf_token": _csrf_token,
    }


with app.app_context():
    # Import models to ensure tables are created
    import models
    db.create_all()

    engine = db.engine
    inspector = inspect(engine)
    user_columns = {column["name"] for column in inspector.get_columns("user")}
    if "language" not in user_columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE user ADD COLUMN language VARCHAR(2) DEFAULT 'en'"))
            conn.execute(text("UPDATE user SET language='en' WHERE language IS NULL"))

    analysis_columns = {column["name"] for column in inspector.get_columns("analysis")}
    column_specs = {
        "is_encrypted": {
            "sqlite": "INTEGER NOT NULL DEFAULT 0",
            "default": "BOOLEAN NOT NULL DEFAULT FALSE",
        },
        "summary_detailed_en": {"default": "TEXT"},
        "summary_normal_en": {"default": "TEXT"},
        "summary_short_en": {"default": "TEXT"},
        "summary_detailed_hu": {"default": "TEXT"},
        "summary_normal_hu": {"default": "TEXT"},
        "summary_short_hu": {"default": "TEXT"},
        "encrypted_extracted_text": {"default": "TEXT"},
        "encrypted_pii_map": {"default": "TEXT"},
        "encrypted_contract_type": {"default": "TEXT"},
        "encrypted_key_terms": {"default": "TEXT"},
        "encrypted_risks": {"default": "TEXT"},
        "encrypted_summary": {"default": "TEXT"},
        "encrypted_summary_detailed_en": {"default": "TEXT"},
        "encrypted_summary_normal_en": {"default": "TEXT"},
        "encrypted_summary_short_en": {"default": "TEXT"},
        "encrypted_summary_detailed_hu": {"default": "TEXT"},
        "encrypted_summary_normal_hu": {"default": "TEXT"},
        "encrypted_summary_short_hu": {"default": "TEXT"},
        "encrypted_legal_references": {"default": "TEXT"},
        "encrypted_legal_reference_issues": {"default": "TEXT"},
    }

    missing_analysis_columns = [
        name for name in column_specs if name not in analysis_columns
    ]

    if missing_analysis_columns:
        dialect = engine.dialect.name

        def _definition(name: str) -> str:
            spec = column_specs[name]
            if dialect == "sqlite" and "sqlite" in spec:
                return spec["sqlite"]
            return spec.get("default", "TEXT")

        with engine.begin() as conn:
            for column_name in missing_analysis_columns:
                conn.execute(
                    text(
                        f"ALTER TABLE analysis ADD COLUMN {column_name} {_definition(column_name)}"
                    )
                )
            if "is_encrypted" in missing_analysis_columns:
                conn.execute(
                    text(
                        "UPDATE analysis SET is_encrypted = 0 WHERE is_encrypted IS NULL"
                    )
                )

    activity_columns = {column["name"] for column in inspector.get_columns("activity_log")}
    activity_specs = {
        "country": {"default": "VARCHAR(100)", "sqlite": "TEXT"},
        "city": {"default": "VARCHAR(100)", "sqlite": "TEXT"},
        "visit_type": {"default": "VARCHAR(20)", "sqlite": "TEXT"},
        "user_agent": {"default": "VARCHAR(255)", "sqlite": "TEXT"},
        "path": {"default": "VARCHAR(512)", "sqlite": "TEXT"},
    }
    missing_activity_columns = [
        name for name in activity_specs if name not in activity_columns
    ]

    if missing_activity_columns:
        dialect = engine.dialect.name

        def _activity_definition(name: str) -> str:
            spec = activity_specs[name]
            if dialect == "sqlite" and "sqlite" in spec:
                return spec["sqlite"]
            return spec.get("default", "TEXT")

        with engine.begin() as conn:
            for column_name in missing_activity_columns:
                conn.execute(
                    text(
                        f"ALTER TABLE activity_log ADD COLUMN {column_name} {_activity_definition(column_name)}"
                    )
                )

    access_request_columns = {
        column["name"] for column in inspector.get_columns("access_request")
    }

    if "username" not in access_request_columns:
        dialect = engine.dialect.name
        with engine.begin() as conn:
            if dialect == "sqlite":
                conn.execute(
                    text(
                        "ALTER TABLE access_request ADD COLUMN username VARCHAR(80) DEFAULT ''"
                    )
                )
                conn.execute(
                    text("UPDATE access_request SET username = '' WHERE username IS NULL")
                )
            else:
                conn.execute(
                    text(
                        "ALTER TABLE access_request ADD COLUMN username VARCHAR(80)"
                    )
                )
                conn.execute(
                    text("UPDATE access_request SET username = '' WHERE username IS NULL")
                )
                conn.execute(
                    text(
                        "ALTER TABLE access_request ALTER COLUMN username SET DEFAULT ''"
                    )
                )
                conn.execute(
                    text(
                        "ALTER TABLE access_request ALTER COLUMN username SET NOT NULL"
                    )
                )

    # Ensure default platform settings exist
    from models import PlatformSetting

    if PlatformSetting.query.filter_by(key="use_pii_sanitizer").first() is None:
        db.session.add(PlatformSetting(key="use_pii_sanitizer", value="false"))
        db.session.commit()

# Import routes
from routes import *
from api_v1 import api_v1

app.register_blueprint(api_v1)
