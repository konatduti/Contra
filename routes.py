import os
import json
import logging
import socket
import ipaddress
import secrets
import string
from datetime import datetime
from urllib.error import HTTPError, URLError
import urllib.request
from flask import g, render_template, request, redirect, url_for, flash, session, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from app import app, db
from models import (
    User,
    Document,
    Analysis,
    AccessRequest,
    Company,
    PlatformSetting,
    LegalDocument,
    AnalysisFeedback,
    CreditTransaction,
    ActivityLog,
)
from cms_main import analyze_document
from llm_pii_sanitizer import sanitize_text_llm
from pii_restorer import restore_text
from ocr_processor import extract_text_from_file
from utils import (
    SUPPORTED_LANGUAGES,
    allowed_file,
    get_file_type,
    get_translation_for_language,
)
from encryption_utils import encrypt_value
from threading import Thread
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

try:  # pragma: no cover - defensive import guard
    from ip2geotools.databases.noncommercial import DbIpCity
    from ip2geotools.errors import Ip2GeoException
except ImportError:  # pragma: no cover - library should be installed via requirements
    DbIpCity = None
    Ip2GeoException = Exception


ADMIN_EMAIL = "admin@contraai.hu"


logger = logging.getLogger(__name__)

_IP_LOCATION_CACHE = {}
_MISSING = object()
_EXCLUDED_ENDPOINTS = {"static"}
_EXCLUDED_PATH_PREFIXES = ("/static/", "/favicon.ico")
_TRUTHY = {"1", "true", "yes", "on"}
_IPAPI_URL_TEMPLATE = os.environ.get("IP_GEOLOCATION_HTTP_URL", "https://ipapi.co/{ip}/json/")
_IPAPI_TIMEOUT = float(os.environ.get("IP_GEOLOCATION_HTTP_TIMEOUT", "3"))
_BOT_KEYWORDS = (
    "bot",
    "crawler",
    "spider",
    "googlebot",
    "bingpreview",
    "bingbot",
    "yandex",
    "duckduckgo",
    "baiduspider",
    "curl",
    "python-requests",
    "node-fetch",
    "httpclient",
    "libwww",
    "wget",
    "httpunit",
)
_OBFUSCATE_IPS = (os.environ.get("ACTIVITY_LOG_OBFUSCATE_IP", "0") or "0").strip().lower() in _TRUTHY
_MAX_USER_AGENT_LENGTH = 255
_EMPTY_LOCATION = {"city": None, "region": None, "country": None, "label": None}


def _should_lookup_ip_location():
    flag = os.environ.get("IP_GEOLOCATION_LOOKUP_ENABLED")
    if flag is None:
        return True
    return flag.strip().lower() in _TRUTHY


def _is_public_ip(ip_address):
    if not ip_address:
        return False
    try:
        ip_obj = ipaddress.ip_address(ip_address)
    except ValueError:
        return False
    return ip_obj.is_global


def _obfuscate_ip(ip_address):
    if not _OBFUSCATE_IPS or not ip_address:
        return ip_address

    try:
        ip_obj = ipaddress.ip_address(ip_address)
    except ValueError:
        return ip_address

    if isinstance(ip_obj, ipaddress.IPv4Address):
        parts = ip_address.split(".")
        if len(parts) >= 4:
            return ".".join(parts[:2] + ["***", "***"])
        return ip_address

    if isinstance(ip_obj, ipaddress.IPv6Address):
        segments = ip_obj.exploded.split(":")
        prefix = ":".join(segments[:3]).rstrip(":")
        if prefix:
            return f"{prefix}::/64"
        return "::/64"

    return ip_address


def _format_location_label(city=None, region=None, country=None):
    parts = [part for part in (country, city, region) if part]
    if not parts:
        return None
    # Ensure country appears first to match reporting expectations
    ordered = []
    if country:
        ordered.append(country)
    if city:
        ordered.append(city)
    if region:
        ordered.append(region)
    return ", ".join(ordered)


def _normalize_location_payload(payload):
    if not payload:
        return dict(_EMPTY_LOCATION)

    country = (payload.get("country") or None) if isinstance(payload, dict) else None
    city = (payload.get("city") or None) if isinstance(payload, dict) else None
    region = (payload.get("region") or None) if isinstance(payload, dict) else None
    label = _format_location_label(city=city, region=region, country=country)
    data = {
        "country": country,
        "city": city,
        "region": region,
        "label": label,
    }
    return data


def lookup_ip_location_details(ip_address):
    """Return structured geo information for the supplied IP address."""

    if not _should_lookup_ip_location() or not _is_public_ip(ip_address):
        return dict(_EMPTY_LOCATION)

    if not ip_address:
        return dict(_EMPTY_LOCATION)

    cached = _IP_LOCATION_CACHE.get(ip_address, _MISSING)
    if cached is not _MISSING:
        return cached

    api_key = os.environ.get("IP_GEOLOCATION_API_KEY", "free")
    payload = _lookup_with_dbip(ip_address, api_key=api_key)
    if not payload:
        payload = _lookup_with_ipapi(ip_address)

    normalized = _normalize_location_payload(payload)
    _IP_LOCATION_CACHE[ip_address] = normalized
    return normalized


def _shorten_user_agent(user_agent):
    if not user_agent:
        return None
    trimmed = user_agent.strip()
    if len(trimmed) <= _MAX_USER_AGENT_LENGTH:
        return trimmed
    return trimmed[: _MAX_USER_AGENT_LENGTH - 1] + "…"


def classify_user_agent(user_agent):
    """Return human/bot/unknown classification for the supplied User-Agent string."""

    if not user_agent:
        return "unknown"

    lowered = user_agent.lower()
    for keyword in _BOT_KEYWORDS:
        if keyword in lowered:
            return "bot"
    return "human"


def _lookup_with_dbip(ip_address, *, api_key):
    if DbIpCity is None:
        logger.debug("IP geolocation lookup skipped; ip2geotools not available")
        return None

    try:
        location = DbIpCity.get(ip_address, api_key=api_key)
    except (Ip2GeoException, HTTPError, URLError, socket.timeout, ValueError) as exc:
        logger.debug("IP lookup failed for %s: %s", ip_address, exc)
        return None
    except Exception as exc:  # noqa: BLE001 - defensive catch-all
        logger.debug("Unexpected IP lookup failure for %s: %s", ip_address, exc)
        return None

    return {
        "city": getattr(location, "city", None) or None,
        "region": getattr(location, "region", None) or None,
        "country": getattr(location, "country", None) or None,
    }


def _lookup_with_ipapi(ip_address):
    """Fallback lookup that queries the ipapi.co service for country data."""

    url = _IPAPI_URL_TEMPLATE.replace("{ip}", ip_address)
    try:
        with urllib.request.urlopen(url, timeout=_IPAPI_TIMEOUT) as response:
            status = getattr(response, "status", 200)
            if status >= 400:
                logger.debug("ipapi.co lookup failed for %s with status %s", ip_address, status)
                return None
            payload = response.read()
    except (HTTPError, URLError, socket.timeout, ValueError) as exc:
        logger.debug("ipapi.co lookup failed for %s: %s", ip_address, exc)
        return None

    try:
        data = json.loads(payload.decode("utf-8"))
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        logger.debug("ipapi.co response parsing failed for %s: %s", ip_address, exc)
        return None

    if not isinstance(data, dict) or data.get("error"):
        logger.debug("ipapi.co returned an error payload for %s: %s", ip_address, data)
        return None

    city = data.get("city")
    region = data.get("region") or data.get("region_code")
    country = data.get("country_name") or data.get("country")
    if not any((city, region, country)):
        return None
    return {
        "city": city or None,
        "region": region or None,
        "country": country or None,
    }


def lookup_ip_location(ip_address):
    """Return a cached city/country label for the IP address when enabled."""

    details = lookup_ip_location_details(ip_address)
    return details.get("label") if details else None


def get_client_ip():
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.remote_addr


def record_activity(
    event_type,
    *,
    user=None,
    company=None,
    document=None,
    ip_address=None,
    analysis_status=None,
    shared_with_contra=None,
    credit_type=None,
    duration_seconds=None,
    details=None,
    visit_type=None,
    user_agent=None,
    path=None,
):
    """Persist a new activity event, swallowing DB errors gracefully."""

    if event_type not in {"visit", "analysis"}:
        raise ValueError(f"Unsupported activity event type: {event_type}")

    if user is None and current_user.is_authenticated:
        user = current_user
    if company is None and user and user.company:
        company = user.company

    occurred_at = datetime.utcnow()
    raw_details = details or {}
    event_details = {k: v for k, v in raw_details.items() if v is not None}
    original_ip = ip_address
    location_details = lookup_ip_location_details(original_ip) if original_ip else dict(_EMPTY_LOCATION)
    stored_ip = _obfuscate_ip(original_ip)
    normalized_visit_type = visit_type or raw_details.get("visit_type")
    if normalized_visit_type:
        normalized_visit_type = normalized_visit_type.strip().lower()
        if normalized_visit_type not in {"human", "bot", "unknown"}:
            normalized_visit_type = None
    path_value = path or raw_details.get("path")
    if path_value:
        event_details.setdefault("path", path_value)
    shortened_agent = _shorten_user_agent(user_agent or raw_details.get("user_agent") or raw_details.get("user_agent_full"))
    if shortened_agent:
        event_details.setdefault("user_agent_short", shortened_agent)
    full_agent = raw_details.get("user_agent_full") or user_agent
    if full_agent:
        event_details.setdefault("user_agent_full", full_agent)
    if normalized_visit_type:
        event_details.setdefault("visit_type", normalized_visit_type)
    if location_details.get("country"):
        event_details.setdefault("country", location_details.get("country"))
    if location_details.get("city"):
        event_details.setdefault("city", location_details.get("city"))

    try:
        if event_type == "visit" and user:
            last_visit = (
                ActivityLog.query.filter_by(user_id=user.id, event_type="visit")
                .order_by(ActivityLog.occurred_at.desc())
                .first()
            )
            if last_visit and last_visit.occurred_at:
                delta = int((occurred_at - last_visit.occurred_at).total_seconds())
                if delta >= 0:
                    last_visit.duration_seconds = delta

        event = ActivityLog(
            event_type=event_type,
            occurred_at=occurred_at,
            user_id=user.id if user else None,
            company_id=company.id if company else None,
            document_id=document.id if document else None,
            ip_address=stored_ip,
            location_label=location_details.get("label"),
            country=location_details.get("country"),
            city=location_details.get("city"),
            duration_seconds=duration_seconds,
            analysis_status=analysis_status,
            shared_with_contra=shared_with_contra if shared_with_contra is not None else None,
            credit_type=credit_type,
            visit_type=normalized_visit_type,
            user_agent=shortened_agent,
            path=path_value,
            details=event_details,
        )
        db.session.add(event)
        db.session.commit()
        return event
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to record %s activity: %s", event_type, exc)
        db.session.rollback()
        return None


@app.before_request
def log_site_visit_activity():
    if request.endpoint in _EXCLUDED_ENDPOINTS:
        return
    path = (request.path or "").lower()
    if any(path.startswith(prefix) for prefix in _EXCLUDED_PATH_PREFIXES):
        return
    if request.method not in {"GET", "HEAD"}:
        return
    if request.path.startswith("/api/"):
        return
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return
    client_ip = get_client_ip()
    user_agent_header = request.headers.get("User-Agent", "")
    visit_type = classify_user_agent(user_agent_header)
    full_path = request.full_path or request.path
    if full_path and full_path.endswith("?"):
        full_path = full_path[:-1]
    record_activity(
        "visit",
        ip_address=client_ip,
        visit_type=visit_type,
        user_agent=user_agent_header,
        path=full_path,
        details={
            "path": full_path,
            "method": request.method,
            "endpoint": request.endpoint,
            "visit_type": visit_type,
            "user_agent_full": user_agent_header,
            "referrer": request.referrer,
            "headers": {
                header: value
                for header, value in (
                    ("Accept", request.headers.get("Accept")),
                    ("Accept-Language", request.headers.get("Accept-Language")),
                    ("Referer", request.referrer),
                )
                if value
            },
        },
    )


def send_email(recipients, subject, body, *, sender_name="Contra Technologies"):
    """Send email messages via SMTP using credentials defined in the environment."""

    if isinstance(recipients, (list, tuple, set)):
        recipient_list = [r for r in recipients if r]
    elif recipients:
        recipient_list = [recipients]
    else:
        recipient_list = []

    if not recipient_list:
        logging.warning("send_email called without recipients")
        return False

    host = (os.environ.get("SMTP_SERVER", "localhost") or "localhost").strip()
    port_raw = os.environ.get("SMTP_PORT", "25")
    try:
        port = int(str(port_raw).strip())
    except (TypeError, ValueError):
        logging.warning("Invalid SMTP_PORT value %r, defaulting to 25", port_raw)
        port = 25
    username = (os.environ.get("SMTP_USERNAME") or os.environ.get("SENDER_EMAIL") or "").strip()
    password = os.environ.get("SMTP_PASSWORD") or os.environ.get("SENDER_PASSWORD")
    if password:
        cleaned_password = "".join(password.split())
        if cleaned_password != password:
            password = cleaned_password
            os.environ["SMTP_PASSWORD"] = password
            os.environ["SENDER_PASSWORD"] = password
    use_tls = (os.environ.get("SMTP_USE_TLS", "true") or "").strip().lower() in _TRUTHY
    from_addr = (
        os.environ.get("SMTP_FROM")
        or os.environ.get("SENDER_EMAIL")
        or username
        or ADMIN_EMAIL
    )
    from_addr = (from_addr or ADMIN_EMAIL).strip()
    display_name = (os.environ.get("SMTP_FROM_NAME") or sender_name or "").strip() or sender_name

    try:
        with smtplib.SMTP(host, port, timeout=10) as server:
            server.ehlo()
            if use_tls:
                server.starttls()
                server.ehlo()
            if username and password:
                server.login(username, password)

            for recipient in recipient_list:
                message = MIMEMultipart()
                message["From"] = formataddr((display_name, from_addr))
                message["To"] = recipient
                message["Subject"] = subject
                message.attach(MIMEText(body, "plain", "utf-8"))
                server.sendmail(from_addr, [recipient], message.as_string())
        return True
    except Exception as exc:  # noqa: BLE001
        logging.exception("Email send failed via %s:%s: %s", host, port, exc)
        return False


def generate_temporary_password(length=6):
    alphabet = string.ascii_lowercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(max(1, length)))


LEGAL_DOC_KEYS = {
    "terms": {"en": "en_terms", "hu": "hu_terms"},
    "privacy": {"en": "en_privacy", "hu": "hu_privacy"},
}


def _legal_defaults():
    return {
        "en_terms": get_translation_for_language("en", "legal.terms.content", ""),
        "hu_terms": get_translation_for_language("hu", "legal.terms.content", ""),
        "en_privacy": get_translation_for_language("en", "legal.privacy.content", ""),
        "hu_privacy": get_translation_for_language("hu", "legal.privacy.content", ""),
    }


def _ensure_legal_documents():
    defaults = _legal_defaults()
    docs = {}
    for key, default_content in defaults.items():
        docs[key] = LegalDocument.get_or_create(key, default_content=default_content)
    return docs


def load_legal_content(slug: str):
    """Load published markdown legal content from DB with locale fallback."""

    language = getattr(g, "current_language", "en")
    if language not in ("en", "hu"):
        language = "en"

    key_name = LEGAL_DOC_KEYS.get(slug, {}).get(language)
    if not key_name:
        return "# Content not available\nPlease add the required copy to the locale files."

    defaults = _legal_defaults()
    document = LegalDocument.get_or_create(key_name, default_content=defaults.get(key_name, ""))
    content = (document.published_content or defaults.get(key_name, "") or "").strip()
    return content or defaults.get(key_name, "")


@app.route('/api/user/language', methods=['POST'])
@login_required
def update_user_language():
    payload = request.get_json(silent=True) or {}
    language = payload.get('language')

    if language not in SUPPORTED_LANGUAGES:
        return jsonify({'error': 'invalid_language'}), 400

    current_user.language = language
    g.current_language = language
    db.session.commit()

    response = jsonify({'language': language})
    response.set_cookie('lang', language, max_age=60 * 60 * 24 * 365, samesite='Lax')
    return response


@app.context_processor
def inject_legal_update_banner():
    show_terms = PlatformSetting.get("legal_terms_banner", "false") == "true"
    show_privacy = PlatformSetting.get("legal_privacy_banner", "false") == "true"
    return {
        "show_legal_terms_banner": show_terms,
        "show_legal_privacy_banner": show_privacy,
    }


def reset_monthly_if_needed(entity):
    """Reset monthly usage for a user or company if a new month has started."""
    # Ensure numeric fields are not None
    if getattr(entity, "monthly_quota", None) is None:
        entity.monthly_quota = 0
    if getattr(entity, "monthly_used", None) is None:
        entity.monthly_used = 0
    if hasattr(entity, "extra_credits") and getattr(entity, "extra_credits", None) is None:
        entity.extra_credits = 0

    now = datetime.utcnow()
    if (
        not entity.last_reset_at
        or entity.last_reset_at.month != now.month
        or entity.last_reset_at.year != now.year
    ):
        entity.monthly_used = 0
        entity.last_reset_at = now
        db.session.commit()


def get_available_credits(user):
    """Return list of available credit options for the user."""
    options = []
    reset_monthly_if_needed(user)
    if user.company:
        reset_monthly_if_needed(user.company)

    language = getattr(g, "current_language", "en")
    credit_labels = {
        "user_monthly": get_translation_for_language(language, "credits.userMonthly", "Individual Monthly"),
        "user_oneoff": get_translation_for_language(language, "credits.userOneOff", "Individual One-off"),
        "company_monthly": get_translation_for_language(language, "credits.companyMonthly", "Company Monthly"),
        "company_oneoff": get_translation_for_language(language, "credits.companyOneOff", "Company One-off"),
    }

    user_remaining = (user.monthly_quota or 0) - (user.monthly_used or 0)
    if user_remaining > 0:
        options.append(("user_monthly", credit_labels["user_monthly"], user_remaining))
    if (user.extra_credits or 0) > 0:
        options.append(("user_oneoff", credit_labels["user_oneoff"], user.extra_credits or 0))
    if user.company:
        company_remaining = (user.company.monthly_quota or 0) - (user.company.monthly_used or 0)
        if company_remaining > 0:
            options.append(("company_monthly", credit_labels["company_monthly"], company_remaining))
        if (user.company.extra_credits or 0) > 0:
            options.append(("company_oneoff", credit_labels["company_oneoff"], user.company.extra_credits or 0))
    return options


def normalize_analysis_content(value):
    """Return a cleaned string for analysis sections, hiding placeholder nulls."""

    if value is None:
        return ""

    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return ""
        if stripped.lower() in {"null", "none", "n/a"}:
            return ""
        return stripped

    return value


def record_credit_transaction(user, amount, description, credit_type=None, document=None, company=None, commit=True):
    """Create a ledger entry for credit movements."""
    company = company or (user.company if credit_type and credit_type.startswith("company") else None)
    transaction = CreditTransaction(
        user_id=user.id,
        amount=amount,
        description=description,
        credit_type=credit_type,
        document_id=document.id if document else None,
        company_id=company.id if company else None,
    )
    db.session.add(transaction)
    if commit:
        db.session.commit()
    return transaction


def deduct_credit(user, credit_type, document=None, description="Analysis credit usage"):
    """Deduct one credit of the given type."""
    if not credit_type:
        return None

    company = user.company if credit_type.startswith("company") else None
    if credit_type == "user_monthly":
        user.monthly_used = (user.monthly_used or 0) + 1
    elif credit_type == "user_oneoff" and (user.extra_credits or 0) > 0:
        user.extra_credits = (user.extra_credits or 0) - 1
    elif credit_type == "company_monthly" and company:
        company.monthly_used = (company.monthly_used or 0) + 1
    elif credit_type == "company_oneoff" and company:
        company.extra_credits = (company.extra_credits or 0) - 1
    else:
        return None

    record_credit_transaction(
        user,
        amount=-1,
        description=description,
        credit_type=credit_type,
        document=document,
        company=company,
        commit=False,
    )
    db.session.commit()
    return credit_type


def refund_credit(user, credit_type, document=None, description="Training allowance refund"):
    """Reverse a previous credit deduction."""
    if not credit_type:
        return None

    company = user.company if credit_type.startswith("company") else None
    if credit_type == "user_monthly":
        user.monthly_used = max((user.monthly_used or 0) - 1, 0)
    elif credit_type == "user_oneoff":
        user.extra_credits = (user.extra_credits or 0) + 1
    elif credit_type == "company_monthly" and company:
        company.monthly_used = max((company.monthly_used or 0) - 1, 0)
    elif credit_type == "company_oneoff" and company:
        company.extra_credits = (company.extra_credits or 0) + 1
    else:
        return None

    record_credit_transaction(
        user,
        amount=1,
        description=description,
        credit_type=credit_type,
        document=document,
        company=company,
        commit=False,
    )
    db.session.commit()
    return credit_type


def award_oneoff_credit(user, amount, description, document=None):
    """Grant one-off credits directly to the user."""
    if amount == 0:
        return None
    user.extra_credits = (user.extra_credits or 0) + amount
    record_credit_transaction(
        user,
        amount=amount,
        description=description,
        credit_type="user_oneoff",
        document=document,
        commit=False,
    )
    db.session.commit()
    return amount


def unlock_document_for_training(document, analysis, user, award_credit=True):
    """Make a previously private document available for training."""
    if document.allow_training:
        return

    # Resolve decrypted fields before mutating state
    resolved_data = {
        'extracted_text': analysis.resolved_extracted_text(),
        'pii_map': analysis.resolved_pii_map() or None,
        'contract_type': analysis.resolved_contract_type(),
        'key_terms': analysis.resolved_key_terms(),
        'risks': analysis.resolved_risks(),
        'summary': analysis.resolved_summary(),
        'legal_references': analysis.resolved_legal_references(),
        'legal_reference_issues': analysis.resolved_legal_reference_issues(),
    }

    document.allow_training = True
    document.allow_training_locked_at = datetime.utcnow()

    analysis.is_encrypted = False
    for field, value in resolved_data.items():
        setattr(analysis, field, value)

    if analysis.credit_type and analysis.credit_deducted:
        refund_credit(user, analysis.credit_type, document=document)

    if award_credit and not document.training_credit_awarded:
        document.training_credit_awarded = True
        award_oneoff_credit(user, 1, "Training allowance bonus", document=document)
    elif award_credit:
        document.training_credit_awarded = True

    db.session.commit()

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/request-access', methods=['GET', 'POST'])
def request_access():
    if request.method == 'POST':
        name = (request.form.get('name') or '').strip()
        username = (request.form.get('username') or '').strip()
        company_name = (request.form.get('company') or '').strip()
        email = (request.form.get('email') or '').strip()
        message = (request.form.get('message') or '').strip() or None
        if not all([name, username, company_name, email]):
            flash('All fields marked as required must be completed.')
            return render_template('request_access.html')
        req = AccessRequest(
            name=name,
            username=username,
            company=company_name,
            email=email,
            message=message,
        )
        db.session.add(req)
        db.session.commit()
        admin_body = (
            f"New access request received.\n\n"
            f"Name: {name}\n"
            f"Username: {username}\n"
            f"Company: {company_name}\n"
            f"Email: {email}\n"
            f"Message:\n{message or '—'}"
        )
        send_email(ADMIN_EMAIL, "New access request", admin_body)
        flash('Access request submitted.')
        return redirect(url_for('index'))
    return render_template('request_access.html')

@app.route('/register', methods=['GET', 'POST'])
@login_required
def register():
    if not current_user.is_admin:
        flash('Only administrators can create users.')
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        company_name = request.form.get('company')
        monthly_quota = request.form.get('monthly_quota', 0, type=int)
        is_admin = bool(request.form.get('is_admin'))
        is_comorg = bool(request.form.get('is_comorg'))

        # Check if user exists
        if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
            flash('Username is taken')
            return render_template('register.html')

        company = None
        if company_name:
            company = Company.query.filter_by(name=company_name).first()
            if not company:
                company = Company(name=company_name)
                db.session.add(company)
                db.session.commit()
            if len(company.users) >= company.seat_limit:
                flash('Seat limit reached.')
                return render_template('register.html')

        if not company:
            is_comorg = False

        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            company_id=company.id if company else None,
            monthly_quota=monthly_quota,
            is_admin=is_admin,
            is_comorg=is_comorg,
        )

        db.session.add(user)
        db.session.commit()

        flash('User created successfully.')
        return redirect(url_for('platform_admin_dashboard'))

    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            reset_monthly_if_needed(user)
            if user.company:
                reset_monthly_if_needed(user.company)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.')
    return redirect(url_for('index'))


@app.route('/change_password', methods=['GET', 'POST'])
@login_required
def change_password():
    if request.method == 'POST':
        current_pw = request.form['current_password']
        new_pw = request.form['new_password']

        if not check_password_hash(current_user.password_hash, current_pw):
            flash('Current password is incorrect.')
            return render_template('change_password.html')

        current_user.password_hash = generate_password_hash(new_pw)
        db.session.commit()
        flash('Password updated successfully.')
        return redirect(url_for('dashboard'))

    return render_template('change_password.html')

@app.route('/dashboard')
@login_required
def dashboard():
    try:
        reset_monthly_if_needed(current_user)
        if current_user.company:
            reset_monthly_if_needed(current_user.company)
        user_documents = Document.query.filter_by(user_id=current_user.id).order_by(Document.upload_date.desc()).all()
        credit_logs = (
            CreditTransaction.query.filter_by(user_id=current_user.id)
            .order_by(CreditTransaction.created_at.desc())
            .all()
        )
        shared_count = sum(1 for doc in user_documents if not doc.is_private)
        private_count = len(user_documents) - shared_count
        return render_template(
            'dashboard.html',
            documents=user_documents,
            credit_transactions=credit_logs,
            shared_count=shared_count,
            private_count=private_count,
        )
    except Exception as e:
        logging.error(f"Dashboard error: {str(e)}")
        flash('Error loading dashboard. Please try again.')
        return redirect(url_for('index'))


@app.route('/documents/<int:document_id>/delete', methods=['POST'])
@login_required
def delete_document(document_id):
    document = Document.query.get_or_404(document_id)

    if document.user_id != current_user.id:
        flash('You do not have permission to delete this document.')
        return redirect(url_for('dashboard'))

    expected_token = session.get('_csrf_token')
    provided_token = request.form.get('csrf_token') or request.headers.get('X-CSRFToken')
    if not expected_token or provided_token != expected_token:
        flash('Invalid deletion request. Please try again.')
        return redirect(url_for('dashboard'))

    analysis = document.analysis

    try:
        file_path = os.path.join(app.config.get('UPLOAD_FOLDER', ''), document.filename)
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
    except Exception as exc:
        logging.warning(f"Failed to remove file for document {document_id}: {exc}")

    try:
        if analysis:
            AnalysisFeedback.query.filter_by(analysis_id=analysis.id).delete()
            db.session.delete(analysis)
        CreditTransaction.query.filter_by(document_id=document.id).delete()
        db.session.delete(document)
        db.session.commit()
        flash('Document deleted successfully.')
    except Exception as exc:
        db.session.rollback()
        logging.error(f"Failed to delete document {document_id}: {exc}")
        flash('Failed to delete the document. Please try again.')

    return redirect(url_for('dashboard'))


@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    reset_monthly_if_needed(current_user)
    if current_user.company:
        reset_monthly_if_needed(current_user.company)
    credit_options = get_available_credits(current_user)

    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file selected')
            return redirect(request.url)

        file = request.files['file']
        if file.filename == '':
            flash('No file selected')
            return redirect(request.url)

        allow_training_choice = request.form.get('allow_training') == 'on'
        credit_type = request.form.get('credit_type')
        valid_credit_types = [opt[0] for opt in credit_options]
        if not valid_credit_types and allow_training_choice:
            credit_type = None
        elif credit_type not in valid_credit_types:
            if allow_training_choice and valid_credit_types:
                credit_type = valid_credit_types[0]
            elif not current_user.is_admin:
                flash('Invalid credit selection.')
                return redirect(request.url)

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add timestamp to avoid conflicts
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
            filename = timestamp + filename
            
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Create document record
            document = Document(
                filename=filename,
                original_filename=file.filename,
                file_type=get_file_type(file.filename),
                user_id=current_user.id,
                file_size=os.path.getsize(filepath),
                allow_training=allow_training_choice,
                allow_training_locked_at=datetime.utcnow() if allow_training_choice else None,
            )
            
            db.session.add(document)
            db.session.commit()
            
            analysis = Analysis(document_id=document.id, status='pending', credit_type=credit_type)
            db.session.add(analysis)
            db.session.commit()

            client_ip = get_client_ip()
            Thread(
                target=process_document,
                args=(document.id, filepath, document.file_type, client_ip),
            ).start()

            return redirect(url_for('processing', document_id=document.id))
        else:
            flash('Invalid file type. Please upload PDF, DOCX, or image files.')

    return render_template('upload.html', credit_options=credit_options)


def process_document(document_id, filepath, file_type, client_ip=None):
    """Background task to process document OCR and analysis."""
    with app.app_context():
        analysis = Analysis.query.filter_by(document_id=document_id).first()
        document = Document.query.get(document_id)
        user = User.query.get(document.user_id)
        activity_log_id = None
        try:
            analysis.status = 'ocr'
            db.session.commit()

            extracted_text = extract_text_from_file(filepath, file_type)

            if not extracted_text.strip():
                analysis.status = 'failed'
                analysis.error_message = 'Could not extract text from the document. Please check the file format.'
                db.session.commit()
                return

            use_pii = PlatformSetting.get('use_pii_sanitizer', 'false') == 'true'
            text_to_analyze = extracted_text
            stored_extracted_text = extracted_text
            stored_pii_map = None
            if use_pii:
                sanitized_text, mapping = sanitize_text_llm(extracted_text)
                text_to_analyze = sanitized_text
                stored_extracted_text = sanitized_text
                stored_pii_map = json.dumps(mapping)

            analysis.status = 'analysis'
            db.session.commit()

            activity_entry = record_activity(
                "analysis",
                user=user,
                company=user.company if user else None,
                document=document,
                ip_address=client_ip,
                analysis_status='analysis',
                shared_with_contra=document.allow_training if document else None,
                credit_type=analysis.credit_type,
                details={
                    "document_name": document.original_filename if document else None,
                    "analysis_id": analysis.id,
                },
            )
            if activity_entry:
                activity_log_id = activity_entry.id

            start_time = datetime.now()
            api_key = os.environ.get("OPENAI_API_KEY", "")
            analysis_result = analyze_document(
                text_to_analyze,
                api_key,
                store_conversation=document.allow_training,
            )
            processing_time = (
                analysis_result.get('elapsed_time')
                or analysis_result.get('elapsed time')
                or (datetime.now() - start_time).total_seconds()
            )

            if use_pii and stored_pii_map:
                mapping = json.loads(stored_pii_map)
                for key in [
                    'key_terms',
                    'risks',
                    'summary',
                    'summary_detailed_en',
                    'summary_normal_en',
                    'summary_short_en',
                    'summary_detailed_hu',
                    'summary_normal_hu',
                    'summary_short_hu',
                ]:
                    if analysis_result.get(key):
                        analysis_result[key] = restore_text(analysis_result[key], mapping)

            contract_type = analysis_result.get('contract_type', '')
            key_terms = analysis_result.get('key_terms', '')
            risks = analysis_result.get('risks', '')
            summary = analysis_result.get('summary', '')
            summary_detailed_en = analysis_result.get('summary_detailed_en', '')
            summary_normal_en = analysis_result.get('summary_normal_en', '')
            summary_short_en = analysis_result.get('summary_short_en', '')
            summary_detailed_hu = analysis_result.get('summary_detailed_hu', '')
            summary_normal_hu = analysis_result.get('summary_normal_hu', '')
            summary_short_hu = analysis_result.get('summary_short_hu', '')
            legal_references = analysis_result.get('legal_references', '')
            legal_reference_issues = analysis_result.get('legal_reference_issues', '')

            if document.allow_training:
                analysis.is_encrypted = False
                analysis.extracted_text = stored_extracted_text
                analysis.pii_map = stored_pii_map
                analysis.contract_type = contract_type
                analysis.key_terms = key_terms
                analysis.risks = risks
                analysis.summary = summary
                analysis.summary_detailed_en = summary_detailed_en
                analysis.summary_normal_en = summary_normal_en
                analysis.summary_short_en = summary_short_en
                analysis.summary_detailed_hu = summary_detailed_hu
                analysis.summary_normal_hu = summary_normal_hu
                analysis.summary_short_hu = summary_short_hu
                analysis.legal_references = legal_references
                analysis.legal_reference_issues = legal_reference_issues
                analysis.encrypted_extracted_text = None
                analysis.encrypted_pii_map = None
                analysis.encrypted_contract_type = None
                analysis.encrypted_key_terms = None
                analysis.encrypted_risks = None
                analysis.encrypted_summary = None
                analysis.encrypted_legal_references = None
                analysis.encrypted_legal_reference_issues = None
            else:
                analysis.is_encrypted = True
                analysis.extracted_text = None
                analysis.pii_map = None
                analysis.contract_type = None
                analysis.key_terms = None
                analysis.risks = None
                analysis.summary = None
                analysis.summary_detailed_en = None
                analysis.summary_normal_en = None
                analysis.summary_short_en = None
                analysis.summary_detailed_hu = None
                analysis.summary_normal_hu = None
                analysis.summary_short_hu = None
                analysis.legal_references = None
                analysis.legal_reference_issues = None
                analysis.encrypted_extracted_text = encrypt_value(stored_extracted_text or '')
                analysis.encrypted_pii_map = encrypt_value(stored_pii_map) if stored_pii_map else None
                analysis.encrypted_contract_type = encrypt_value(contract_type or '')
                analysis.encrypted_key_terms = encrypt_value(key_terms or '')
                analysis.encrypted_risks = encrypt_value(risks or '')
                analysis.encrypted_summary = encrypt_value(summary or '')
                analysis.encrypted_summary_detailed_en = encrypt_value(summary_detailed_en or '')
                analysis.encrypted_summary_normal_en = encrypt_value(summary_normal_en or '')
                analysis.encrypted_summary_short_en = encrypt_value(summary_short_en or '')
                analysis.encrypted_summary_detailed_hu = encrypt_value(summary_detailed_hu or '')
                analysis.encrypted_summary_normal_hu = encrypt_value(summary_normal_hu or '')
                analysis.encrypted_summary_short_hu = encrypt_value(summary_short_hu or '')
                analysis.encrypted_legal_references = encrypt_value(legal_references or '')
                analysis.encrypted_legal_reference_issues = encrypt_value(legal_reference_issues or '')

            analysis.detected_language = analysis_result.get('detected_language', '')
            analysis.processing_time = processing_time
            analysis.status = 'completed'

            if activity_log_id:
                log_entry = db.session.get(ActivityLog, activity_log_id)
                if log_entry:
                    log_entry.analysis_status = analysis.status

            if analysis.credit_type and not analysis.credit_deducted:
                deduct_credit(user, analysis.credit_type, document=document)
                analysis.credit_deducted = True
                if document.allow_training:
                    refund_credit(user, analysis.credit_type, document=document)
            if document.allow_training and not document.training_credit_awarded:
                document.training_credit_awarded = True
                award_oneoff_credit(user, 1, "Training allowance bonus", document=document)

            db.session.commit()
        except Exception as e:
            analysis.status = 'failed'
            analysis.error_message = str(e)
            if activity_log_id:
                log_entry = db.session.get(ActivityLog, activity_log_id)
                if log_entry:
                    log_entry.analysis_status = 'failed'
            db.session.commit()

@app.route('/processing/<int:document_id>')
@login_required
def processing(document_id):
    document = Document.query.get_or_404(document_id)
    
    # Check if user owns this document
    if document.user_id != current_user.id:
        flash('You do not have permission to view this document.')
        return redirect(url_for('dashboard'))
    
    return render_template('processing.html', document=document)

@app.route('/check_analysis/<int:document_id>')
@login_required
def check_analysis(document_id):
    document = Document.query.get_or_404(document_id)
    
    # Check if user owns this document
    if document.user_id != current_user.id:
        return jsonify({'error': 'Permission denied'}), 403
    
    analysis = Analysis.query.filter_by(document_id=document_id).first()
    
    if not analysis:
        return jsonify({'status': 'pending'})
    
    return jsonify({'status': analysis.status})

@app.route('/analysis/<int:document_id>')
@login_required
def view_analysis(document_id):
    document = Document.query.get_or_404(document_id)
    
    # Check if user owns this document
    if document.user_id != current_user.id:
        flash('You do not have permission to view this document.')
        return redirect(url_for('dashboard'))
    
    analysis = Analysis.query.filter_by(document_id=document_id).first()
    
    if not analysis:
        flash('Analysis not found for this document.')
        return redirect(url_for('dashboard'))

    analysis_view = {
        key: normalize_analysis_content(value)
        for key, value in {
            'summary': analysis.resolved_summary(),
            'key_terms': analysis.resolved_key_terms(),
            'risks': analysis.resolved_risks(),
            'contract_type': analysis.resolved_contract_type(),
            'legal_references': analysis.resolved_legal_references(),
            'legal_reference_issues': analysis.resolved_legal_reference_issues(),
        }.items()
    }
    fallback_summary = analysis_view.get('summary', '')
    raw_summary_variants = analysis.resolved_summary_variants()
    summary_variants = {
        lang: {
            length: normalize_analysis_content(text)
            for length, text in variants.items()
            if normalize_analysis_content(text)
        }
        for lang, variants in raw_summary_variants.items()
    }
    summary_variants = {
        lang: variants for lang, variants in summary_variants.items() if variants
    }
    if fallback_summary:
        summary_variants.setdefault('en', {})
        summary_variants['en'].setdefault('normal', fallback_summary)

    summary_length_order = ['short', 'normal', 'detailed']
    available_lengths = [
        length
        for length in summary_length_order
        if any(summary_variants.get(lang, {}).get(length) for lang in summary_variants)
    ]
    current_language = getattr(g, "current_language", "en")
    default_summary = ""
    default_length = 'normal'
    for length in summary_length_order:
        candidate = summary_variants.get(current_language, {}).get(length)
        if candidate:
            default_summary = candidate
            default_length = length
            break
    if not default_summary:
        for length in summary_length_order:
            candidate = summary_variants.get('en', {}).get(length)
            if candidate:
                default_summary = candidate
                default_length = length
                break
    if not default_summary:
        default_summary = fallback_summary

    analysis_view['summary'] = default_summary or ''
    if not available_lengths and analysis_view['summary']:
        available_lengths = [default_length]
    analysis_contract_type = normalize_analysis_content(analysis.contract_type)
    analysis_detected_language = normalize_analysis_content(analysis.detected_language)
    feedback_entries = (
        AnalysisFeedback.query.filter_by(analysis_id=analysis.id, user_id=current_user.id)
        .order_by(AnalysisFeedback.created_at.desc())
        .all()
    )

    return render_template(
        'analysis_result.html',
        document=document,
        analysis=analysis,
        analysis_view=analysis_view,
        feedback_entries=feedback_entries,
        analysis_contract_type=analysis_contract_type,
        analysis_detected_language=analysis_detected_language,
        summary_variants=summary_variants,
        summary_length_default=default_length if available_lengths else 'normal',
        summary_length_options=available_lengths,
        current_language=current_language,
    )


@app.route('/analysis/<int:document_id>/allow-training', methods=['POST'])
@login_required
def allow_training(document_id):
    document = Document.query.get_or_404(document_id)
    if document.user_id != current_user.id:
        flash('You do not have permission to modify this document.')
        return redirect(url_for('dashboard'))

    analysis = Analysis.query.filter_by(document_id=document_id).first()
    if not analysis:
        flash('Analysis not found for this document.')
        return redirect(url_for('dashboard'))

    if document.allow_training:
        flash('Training access has already been granted for this document.')
        return redirect(url_for('view_analysis', document_id=document.id))

    unlock_document_for_training(document, analysis, current_user, award_credit=True)
    flash('Thank you! Developers can now use this document for training and a credit has been added to your account.')
    return redirect(url_for('view_analysis', document_id=document.id))


@app.route('/analysis/<int:document_id>/feedback', methods=['POST'])
@login_required
def submit_feedback(document_id):
    document = Document.query.get_or_404(document_id)
    if document.user_id != current_user.id:
        flash('You do not have permission to provide feedback for this analysis.')
        return redirect(url_for('dashboard'))

    analysis = Analysis.query.filter_by(document_id=document_id).first()
    if not analysis:
        flash('Analysis not found for this document.')
        return redirect(url_for('dashboard'))

    feedback_text = request.form.get('feedback', '').strip()
    rating = request.form.get('rating', type=int)

    if not feedback_text:
        flash('Please provide feedback before submitting.')
        return redirect(url_for('view_analysis', document_id=document.id))

    prior_award = AnalysisFeedback.query.filter_by(
        analysis_id=analysis.id, user_id=current_user.id, credit_awarded=True
    ).first()
    award_feedback_credit = prior_award is None

    feedback_entry = AnalysisFeedback(
        analysis_id=analysis.id,
        user_id=current_user.id,
        rating=rating,
        comment=feedback_text,
    )
    if award_feedback_credit:
        feedback_entry.credit_awarded = True
    db.session.add(feedback_entry)
    db.session.commit()

    unlock_document_for_training(
        document,
        analysis,
        current_user,
        award_credit=not document.training_credit_awarded,
    )

    if award_feedback_credit:
        award_oneoff_credit(current_user, 1, "Feedback bonus", document=document)

    flash('Thank you for your feedback! You have earned an additional credit.')
    return redirect(url_for('view_analysis', document_id=document.id))


@app.route('/platform-admin')
@login_required
def platform_admin_dashboard():
    if not current_user.is_admin:
        flash('You do not have permission to access this page.')
        return redirect(url_for('dashboard'))

    requests = AccessRequest.query.filter_by(status='pending').all()
    companies = Company.query.all()
    for company in companies:
        reset_monthly_if_needed(company)
    users = User.query.all()
    for user in users:
        reset_monthly_if_needed(user)
    impact_numbers = {
        "companies_adjusted": max(Company.query.count() - 2, 0),
    }
    credit_logs = {
        user.id: CreditTransaction.query.filter_by(user_id=user.id)
        .order_by(CreditTransaction.created_at.desc())
        .limit(25)
        .all()
        for user in users
    }
    settings = {s.key: s.value for s in PlatformSetting.query.all()}
    activity_logs = (
        ActivityLog.query.order_by(ActivityLog.occurred_at.desc()).limit(200).all()
    )
    recent_visit_logs = (
        ActivityLog.query.filter_by(event_type="visit")
        .order_by(ActivityLog.occurred_at.desc())
        .limit(100)
        .all()
    )

    return render_template('platform_admin.html',
                           requests=requests,
                           companies=companies,
                           users=users,
                           settings=settings,
                           credit_logs=credit_logs,
                           impact_numbers=impact_numbers,
                           activity_logs=activity_logs,
                           recent_visits=recent_visit_logs)


@app.route('/platform-admin/requests/accept', methods=['POST'])
@login_required
def accept_request():
    if not current_user.is_admin:
        return redirect(url_for('dashboard'))

    def _safe_int(value, default, minimum):
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            parsed = default
        return max(parsed, minimum)

    request_id = request.form.get('request_id', type=int)
    if not request_id:
        flash('Invalid access request.')
        return redirect(url_for('platform_admin_dashboard'))

    req = AccessRequest.query.get_or_404(request_id)
    if req.status != 'pending':
        flash('This request has already been processed.')
        return redirect(url_for('platform_admin_dashboard'))

    username = (req.username or '').strip()
    if not username:
        flash('The access request does not include a username.')
        return redirect(url_for('platform_admin_dashboard'))

    if User.query.filter_by(username=username).first():
        flash('Username is taken')
        return redirect(url_for('platform_admin_dashboard'))
    if User.query.filter_by(email=req.email).first():
        flash('Email is already registered.')
        return redirect(url_for('platform_admin_dashboard'))
    if Company.query.filter_by(name=req.company).first():
        flash('A company with this name already exists.')
        return redirect(url_for('platform_admin_dashboard'))

    seat_limit = _safe_int(request.form.get('seat_limit'), 1, 1)
    monthly_quota = _safe_int(request.form.get('monthly_quota'), 0, 0)
    extra_credits = _safe_int(request.form.get('extra_credits'), 0, 0)
    temp_password = generate_temporary_password()

    try:
        company = Company(
            name=req.company,
            seat_limit=seat_limit,
            monthly_quota=monthly_quota,
            extra_credits=extra_credits,
        )
        db.session.add(company)
        db.session.flush()

        user = User(
            username=username,
            email=req.email,
            password_hash=generate_password_hash(temp_password),
            is_comorg=True,
            company_id=company.id,
        )
        db.session.add(user)

        req.status = 'accepted'
        req.decided_at = datetime.utcnow()

        db.session.commit()
    except Exception as exc:  # noqa: BLE001
        db.session.rollback()
        logging.error('Failed to approve access request %s: %s', request_id, exc)
        flash('Failed to approve the access request. Please try again.')
        return redirect(url_for('platform_admin_dashboard'))

    email_body = (
        f"Hi {req.name},\n\n"
        f"Your registration request for Contra has been approved.\n\n"
        f"Username: {username}\n"
        f"Temporary password: {temp_password}\n\n"
        "Please change your password after your first login.\n\n"
        "Happy analysing!\n"
        "Contra Technologies"
    )
    send_email(req.email, 'Access approved', email_body)
    flash('Access request approved and company created.')
    return redirect(url_for('platform_admin_dashboard'))


@app.route('/platform-admin/requests/<int:request_id>/reject', methods=['POST'])
@login_required
def reject_request(request_id):
    if not current_user.is_admin:
        return redirect(url_for('dashboard'))
    req = AccessRequest.query.get_or_404(request_id)
    req.status = 'rejected'
    req.decided_at = datetime.utcnow()
    db.session.commit()
    email_body = (
        f"Hi {req.name},\n\n"
        "Thank you for your interest in Contra. After reviewing your request, we are unable to approve it at this time."
        "\n\nIf you believe this is a mistake or would like to provide more information, please reply to this email."
        "\n\nBest regards,\nContra Technologies"
    )
    send_email(req.email, 'Access request rejected', email_body)
    return redirect(url_for('platform_admin_dashboard'))


@app.route('/platform-admin/messages', methods=['POST'])
@login_required
def admin_send_message():
    if not current_user.is_admin:
        return redirect(url_for('dashboard'))

    subject = (request.form.get('subject') or '').strip()
    body = (request.form.get('body') or '').strip()
    selected_ids = request.form.getlist('company_ids')

    if not subject or not body:
        flash('Subject and message are required.')
        return redirect(url_for('platform_admin_dashboard'))

    include_all = '__all__' in selected_ids or not selected_ids
    company_ids = []
    if not include_all:
        for cid in selected_ids:
            try:
                company_ids.append(int(cid))
            except (TypeError, ValueError):
                continue
        if not company_ids:
            flash('Please select at least one company.')
            return redirect(url_for('platform_admin_dashboard'))

    query = User.query.filter(User.email.isnot(None), User.email != '')
    if include_all:
        query = query.filter(User.company_id.isnot(None))
    else:
        query = query.filter(User.company_id.in_(company_ids))

    recipients = sorted({user.email for user in query.all()})
    if not recipients:
        flash('No recipients found for the selected companies.')
        return redirect(url_for('platform_admin_dashboard'))

    if send_email(recipients, subject, body):
        flash(f'Email sent to {len(recipients)} recipient(s).')
    else:
        flash('Failed to send the email. Please check the email settings.')

    return redirect(url_for('platform_admin_dashboard'))


@app.route('/platform-admin/legal-docs', methods=['GET', 'POST'])
@login_required
def admin_legal_docs_editor():
    if not current_user.is_admin:
        flash('You do not have permission to access this page.')
        return redirect(url_for('dashboard'))

    docs = _ensure_legal_documents()

    if request.method == 'POST':
        action = request.form.get('action', 'save')
        updated_values = {
            'hu_terms': request.form.get('hu_terms', ''),
            'hu_privacy': request.form.get('hu_privacy', ''),
            'en_terms': request.form.get('en_terms', ''),
            'en_privacy': request.form.get('en_privacy', ''),
        }

        for key, value in updated_values.items():
            docs[key].draft_content = value

        if action == 'apply':
            for key in updated_values:
                docs[key].published_content = docs[key].draft_content
            flash('Legal document changes applied.')
        elif action == 'discard':
            for key in updated_values:
                docs[key].draft_content = docs[key].published_content
            flash('Draft changes discarded.')
        else:
            flash('Legal document draft saved.')

        db.session.commit()
        return redirect(url_for('admin_legal_docs_editor'))

    return render_template(
        'platform_admin_legal_docs.html',
        hu_terms=docs['hu_terms'].draft_content,
        hu_privacy=docs['hu_privacy'].draft_content,
        en_terms=docs['en_terms'].draft_content,
        en_privacy=docs['en_privacy'].draft_content,
    )


@app.route('/platform-admin/settings', methods=['POST'])
@login_required
def admin_update_settings():
    if not current_user.is_admin:
        return redirect(url_for('dashboard'))

    use_pii = request.form.get('use_pii_sanitizer') == 'on'
    show_terms_banner = request.form.get('legal_terms_banner') == 'on'
    show_privacy_banner = request.form.get('legal_privacy_banner') == 'on'

    PlatformSetting.set('use_pii_sanitizer', 'true' if use_pii else 'false')
    PlatformSetting.set('legal_terms_banner', 'true' if show_terms_banner else 'false')
    PlatformSetting.set('legal_privacy_banner', 'true' if show_privacy_banner else 'false')
    flash('Platform settings updated.')
    return redirect(url_for('platform_admin_dashboard'))


@app.route('/platform-admin/companies', methods=['POST'])
@login_required
def admin_create_company():
    """Create a new company directly from the platform admin dashboard."""
    if not current_user.is_admin:
        return redirect(url_for('dashboard'))
    name = request.form['name']
    seat_limit = request.form.get('seat_limit', type=int, default=1)
    monthly_quota = request.form.get('monthly_quota', type=int, default=0)
    extra_credits = request.form.get('extra_credits', type=int, default=0)
    if Company.query.filter_by(name=name).first():
        flash('Company already exists.')
    else:
        company = Company(name=name,
                          seat_limit=seat_limit,
                          monthly_quota=monthly_quota,
                          extra_credits=extra_credits)
        db.session.add(company)
        db.session.commit()
        flash('Company created.')
    return redirect(url_for('platform_admin_dashboard'))


@app.route('/platform-admin/companies/<int:company_id>/delete', methods=['POST'])
@login_required
def admin_delete_company(company_id):
    if not current_user.is_admin:
        return redirect(url_for('dashboard'))
    company = Company.query.get_or_404(company_id)
    for user in company.users:
        db.session.delete(user)
    db.session.delete(company)
    db.session.commit()
    flash('Company removed.')
    return redirect(url_for('platform_admin_dashboard'))


@app.route('/company-organizer/<int:company_id>')
@login_required
def company_organizer_dashboard(company_id):
    company = Company.query.get_or_404(company_id)
    reset_monthly_if_needed(company)
    if not (current_user.is_admin or (current_user.is_comorg and current_user.company_id == company_id)):
        flash('You do not have permission to access this company.')
        return redirect(url_for('dashboard'))
    members = User.query.filter_by(company_id=company_id).all()
    for member in members:
        reset_monthly_if_needed(member)
    can_manage = current_user.is_admin or (current_user.is_comorg and current_user.company_id == company_id)
    return render_template('company_organizer.html', company=company, members=members, can_manage=can_manage)


@app.route('/company-organizer/<int:company_id>/update', methods=['POST'])
@login_required
def update_company(company_id):
    """Update company seat limits or credits (admin only)."""
    company = Company.query.get_or_404(company_id)
    if not current_user.is_admin:
        return redirect(url_for('dashboard'))
    seat_limit = request.form.get('seat_limit', type=int)
    monthly_quota = request.form.get('monthly_quota', type=int)
    extra_credits = request.form.get('extra_credits', type=int)
    if seat_limit is not None:
        company.seat_limit = seat_limit
    if monthly_quota is not None:
        company.monthly_quota = monthly_quota
    if extra_credits is not None:
        company.extra_credits = extra_credits
    db.session.commit()
    flash('Company settings updated.')
    return redirect(url_for('company_organizer_dashboard', company_id=company_id))


@app.route('/company-organizer/<int:company_id>/delete', methods=['POST'])
@login_required
def delete_company(company_id):
    """Remove a company and all its members."""
    company = Company.query.get_or_404(company_id)
    if not (current_user.is_admin or (current_user.is_comorg and current_user.company_id == company_id)):
        return redirect(url_for('dashboard'))
    for user in company.users:
        db.session.delete(user)
    db.session.delete(company)
    db.session.commit()
    flash('Company deleted.')
    if current_user.is_admin:
        return redirect(url_for('platform_admin_dashboard'))
    else:
        return redirect(url_for('dashboard'))


@app.route('/company-organizer/<int:company_id>/update-user/<int:user_id>', methods=['POST'])
@login_required
def update_company_user(company_id, user_id):
    if not current_user.is_admin:
        return redirect(url_for('dashboard'))
    user = User.query.filter_by(id=user_id, company_id=company_id).first_or_404()
    new_password = request.form.get('password')
    monthly_quota = request.form.get('monthly_quota', type=int)
    extra_credits = request.form.get('extra_credits', type=int)
    if new_password:
        user.password_hash = generate_password_hash(new_password)
    if monthly_quota is not None:
        user.monthly_quota = monthly_quota
    if extra_credits is not None:
        user.extra_credits = extra_credits
    db.session.commit()
    flash('Member updated.')
    return redirect(url_for('company_organizer_dashboard', company_id=company_id))


@app.route('/company-organizer/<int:company_id>/add-user', methods=['POST'])
@login_required
def add_company_user(company_id):
    if not (current_user.is_admin or (current_user.is_comorg and current_user.company_id == company_id)):
        return redirect(url_for('dashboard'))
    company = Company.query.get_or_404(company_id)
    if len(company.users) >= company.seat_limit:
        flash('Seat limit reached.')
        return redirect(url_for('company_organizer_dashboard', company_id=company_id))
    username = request.form['username']
    email = request.form['email']
    password = request.form['password']
    is_comorg = bool(request.form.get('is_comorg'))
    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        flash('Username is taken')
        return redirect(url_for('company_organizer_dashboard', company_id=company_id))
    user = User(username=username, email=email, password_hash=generate_password_hash(password), company_id=company_id, is_comorg=is_comorg)
    db.session.add(user)
    db.session.commit()
    flash('User added.')
    return redirect(url_for('company_organizer_dashboard', company_id=company_id))


@app.route('/company-organizer/<int:company_id>/remove-user/<int:user_id>', methods=['POST'])
@login_required
def remove_company_user(company_id, user_id):
    if not (current_user.is_admin or (current_user.is_comorg and current_user.company_id == company_id)):
        return redirect(url_for('dashboard'))
    user = User.query.filter_by(id=user_id, company_id=company_id).first_or_404()
    db.session.delete(user)
    db.session.commit()
    flash('User removed.')
    return redirect(url_for('company_organizer_dashboard', company_id=company_id))


@app.route('/platform-admin/users', methods=['POST'])
@login_required
def admin_create_user():
    if not current_user.is_admin:
        return redirect(url_for('dashboard'))

    username = request.form['username']
    email = request.form['email']
    password = request.form['password']
    monthly_quota = request.form.get('monthly_quota', 0, type=int)
    company_id = request.form.get('company_id', type=int)
    is_admin = bool(request.form.get('is_admin'))
    is_comorg = bool(request.form.get('is_comorg'))

    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        flash('Username is taken')
        return redirect(url_for('platform_admin_dashboard'))

    company = None
    if company_id:
        company = Company.query.get(company_id)
        if not company:
            flash('Company not found.')
            return redirect(url_for('platform_admin_dashboard'))
        if len(company.users) >= company.seat_limit:
            flash('Seat limit reached.')
            return redirect(url_for('platform_admin_dashboard'))

    if not company:
        is_comorg = False

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        monthly_quota=monthly_quota,
        company_id=company.id if company else None,
        is_admin=is_admin,
        is_comorg=is_comorg,
    )
    db.session.add(user)
    db.session.commit()
    flash('User created.')
    return redirect(url_for('platform_admin_dashboard'))


@app.route('/platform-admin/users/<int:user_id>', methods=['POST'])
@login_required
def admin_update_user(user_id):
    if not current_user.is_admin:
        return redirect(url_for('dashboard'))

    user = User.query.get_or_404(user_id)
    quota = request.form.get('monthly_quota', type=int)
    credit_amount = request.form.get('credit_amount', type=int)
    new_password = request.form.get('new_password')
    is_admin = bool(request.form.get('is_admin'))
    is_comorg = bool(request.form.get('is_comorg'))
    company_id = request.form.get('company_id', type=int)

    if company_id:
        company = Company.query.get(company_id)
        if not company:
            flash('Company not found.')
            return redirect(url_for('platform_admin_dashboard'))
        if user.company_id != company_id and len(company.users) >= company.seat_limit:
            flash('Seat limit reached.')
            return redirect(url_for('platform_admin_dashboard'))
        user.company_id = company_id
    else:
        user.company_id = None

    if quota is not None:
        user.monthly_quota = quota
    if credit_amount:
        credit_amount = int(credit_amount)  # ensure it's an int
        user.extra_credits = (user.extra_credits or 0) + credit_amount
    if new_password:
        user.password_hash = generate_password_hash(new_password)

    user.is_admin = is_admin
    user.is_comorg = is_comorg if user.company_id else False

    db.session.commit()
    flash('User updated.')
    return redirect(url_for('platform_admin_dashboard'))


@app.route('/terms')
def terms():
    content = load_legal_content('terms')
    page_title = get_translation_for_language(
        getattr(g, "current_language", "en"),
        "legal.terms.title",
        "Terms & Conditions",
    )
    return render_template('legal_page.html', page_title=page_title, content=content)


@app.route('/privacy')
def privacy():
    content = load_legal_content('privacy')
    page_title = get_translation_for_language(
        getattr(g, "current_language", "en"),
        "legal.privacy.title",
        "Privacy Policy",
    )
    return render_template('legal_page.html', page_title=page_title, content=content)


@app.errorhandler(404)
def not_found(error):
    return render_template('base.html', error_message='Page not found'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('base.html', error_message='Internal server error'), 500
