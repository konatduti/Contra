import os
import logging
import re
import json
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib import request
from threading import Lock
from PIL import Image
from PIL import ImageEnhance, ImageFilter
import pytesseract
from pdf2image import convert_from_path
from google.cloud import vision
from google.oauth2 import service_account
import docx
from docx.enum.text import WD_BREAK
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import _Cell, Table
from docx.text.paragraph import Paragraph


LANGUAGE_HINTS = {
    'hu': 'hun',
    'hungarian': 'hun',
    'en': 'eng',
    'english': 'eng',
    'de': 'deu',
    'german': 'deu',
    'fr': 'fra',
    'french': 'fra',
    'es': 'spa',
    'spanish': 'spa',
    'it': 'ita',
    'italian': 'ita',
}

VISION_LANGUAGE_HINTS = {
    'hun': 'hu',
    'eng': 'en',
    'deu': 'de',
    'fra': 'fr',
    'spa': 'es',
    'ita': 'it',
}

GARBAGE_PATTERNS = [
    r"[A-Za-z]\.[A-Za-z]\.[A-Za-z]",
    r"\b(?:eee+|ccc+|000+)\b",
    r"[^\w\s]{3,}",
]


GOOGLE_SERVICE_ACCOUNT_FIELDS = [
    'type',
    'project_id',
    'private_key_id',
    'private_key',
    'client_email',
    'client_id',
    'auth_uri',
    'token_uri',
    'auth_provider_x509_cert_url',
    'client_x509_cert_url',
    'universe_domain',
]


_GOOGLE_VISION_CLIENT = None
_GOOGLE_VISION_CLIENT_ERROR = None
_GOOGLE_VISION_CLIENT_LOCK = Lock()

def extract_text_from_file(file_path, file_type):
    """
    Extract text from various file types using appropriate methods
    """
    try:
        if file_type == 'pdf':
            return extract_text_from_pdf(file_path)
        elif file_type == 'docx':
            return extract_text_from_docx(file_path)
        elif file_type == 'image':
            return extract_text_from_image(file_path)
        elif file_type == 'txt':
            return extract_text_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    except Exception as e:
        logging.error(f"Error extracting text from {file_path}: {e}")
        raise


def extract_text_from_pdf(file_path):
    """
    Extract text from PDF using OCR
    """
    try:
        images = convert_from_path(file_path, dpi=300)
        selected_lang = determine_ocr_language(file_path)
        providers = get_ocr_provider_chain()

        if not images:
            raise ValueError("No pages detected in the PDF document")

        logging.info("PDF contains %s pages – starting OCR with lang=%s", len(images), selected_lang)

        def process_page(task):
            index, page_image = task
            try:
                logging.info("Processing PDF page %s/%s", index + 1, len(images))
                prepared = preprocess_image(page_image)
                text, provider_meta = run_ocr_with_fallback(prepared, selected_lang, providers)
                logging.info(
                    "PDF page %s OCR via %s with quality %.3f",
                    index + 1,
                    provider_meta.get('provider', 'unknown'),
                    provider_meta.get('quality_score', 0.0),
                )
                return index, text
            except Exception as ocr_error:
                logging.warning("OCR failed for page %s: %s", index + 1, ocr_error)
                return index, ""

        max_workers = min(len(images), os.cpu_count() or 1, 6) or 1
        page_texts = [""] * len(images)

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(process_page, (idx, image)): idx
                for idx, image in enumerate(images)
            }
            for future in as_completed(futures):
                index, text = future.result()
                if text and text.strip():
                    page_texts[index] = text

        full_text = '\n\n'.join(filter(None, page_texts))

        if not full_text.strip():
            raise ValueError("No text could be extracted from the PDF")

        return full_text

    except Exception as e:
        logging.error(f"Error processing PDF: {e}")
        raise ValueError(f"Failed to process PDF file: {str(e)}")


def extract_text_from_docx(file_path):
    """
    Extract text from DOCX file
    """
    try:
        document = docx.Document(file_path)

        def iter_block_items(parent):
            if isinstance(parent, _Cell):
                parent_element = parent._tc
            else:
                parent_element = parent.element.body
            for child in parent_element.iterchildren():
                if isinstance(child, CT_P):
                    yield Paragraph(child, parent)
                elif isinstance(child, CT_Tbl):
                    yield Table(child, parent)

        pages = []
        current_parts = []

        def push_page():
            combined = '\n'.join(part for part in current_parts if part)
            if combined.strip():
                pages.append(combined)
            current_parts.clear()

        for block in iter_block_items(document):
            if isinstance(block, Paragraph):
                text = block.text.strip()
                if text:
                    current_parts.append(text)
                has_page_break = any(
                    getattr(run, "break_type", None) == WD_BREAK.PAGE
                    for run in block.runs
                )
                if has_page_break:
                    push_page()
            elif isinstance(block, Table):
                table_lines = []
                for row in block.rows:
                    row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_text:
                        table_lines.append(' | '.join(row_text))
                if table_lines:
                    current_parts.append('\n'.join(table_lines))

        push_page()

        if not pages:
            raise ValueError("No text could be extracted from the DOCX file")

        max_workers = min(len(pages), os.cpu_count() or 1, 6) or 1
        if max_workers > 1:
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                processed_pages = list(executor.map(lambda page: page.strip(), pages))
        else:
            processed_pages = [page.strip() for page in pages]

        full_text = '\n\n'.join(filter(None, processed_pages))

        if not full_text.strip():
            raise ValueError("No text could be extracted from the DOCX file")

        return full_text

    except Exception as e:
        logging.error(f"Error processing DOCX: {e}")
        raise ValueError(f"Failed to process DOCX file: {str(e)}")


def extract_text_from_image(file_path):
    """
    Extract text from image using OCR
    """
    try:
        image = Image.open(file_path)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        selected_lang = determine_ocr_language(file_path)
        providers = get_ocr_provider_chain()
        prepared = preprocess_image(image)
        text, provider_meta = run_ocr_with_fallback(prepared, selected_lang, providers)

        logging.info(
            "Image OCR via %s with language %s and quality %.3f",
            provider_meta.get('provider', 'unknown'),
            selected_lang,
            provider_meta.get('quality_score', 0.0),
        )
        
        if not text.strip():
            raise ValueError("No text could be extracted from the image")

        return text

    except Exception as e:
        logging.error(f"Error processing image: {e}")
        raise ValueError(f"Failed to process image file: {str(e)}")


def extract_text_from_txt(file_path):
    """
    Extract text from TXT file
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            text = file.read()

        if not text.strip():
            raise ValueError("The text file is empty")

        return text

    except UnicodeDecodeError:
        try:
            with open(file_path, 'r', encoding='latin-1') as file:
                text = file.read()
            return text
        except Exception as e:
            logging.error(f"Error reading text file with latin-1: {e}")
            raise ValueError(f"Failed to read text file: {str(e)}")
    except Exception as e:
        logging.error(f"Error processing text file: {e}")
        raise ValueError(f"Failed to process text file: {str(e)}")


def preprocess_image(image):
    """
    Preprocess image for better OCR results.
    """
    try:
        if image.mode != 'RGB':
            image = image.convert('RGB')

        steps_applied = []
        if should_enable_preprocessing_step('OCR_ENABLE_AUTOROTATE', True):
            image = auto_orient_image(image)
            steps_applied.append('autorotate')

        gray = image.convert('L')
        steps_applied.append('grayscale')

        contrast_factor = float(os.environ.get('OCR_CONTRAST_FACTOR', '1.6'))
        gray = ImageEnhance.Contrast(gray).enhance(contrast_factor)
        steps_applied.append(f'contrast_{contrast_factor}')

        if should_enable_preprocessing_step('OCR_ENABLE_DENOISE', True):
            gray = gray.filter(ImageFilter.MedianFilter(size=3))
            steps_applied.append('median_denoise')

        if should_enable_preprocessing_step('OCR_ENABLE_BINARIZE', True):
            threshold = int(os.environ.get('OCR_BINARY_THRESHOLD', '170'))
            gray = gray.point(lambda p: 255 if p > threshold else 0)
            steps_applied.append(f'binarize_{threshold}')

        if should_enable_preprocessing_step('OCR_ENABLE_UPSCALE', True):
            min_side = int(os.environ.get('OCR_UPSCALE_MIN_SIDE', '1400'))
            width, height = gray.size
            if min(width, height) < min_side:
                scale = max(min_side / max(min(width, height), 1), 1)
                gray = gray.resize((int(width * scale), int(height * scale)), Image.Resampling.LANCZOS)
                steps_applied.append(f'upscale_{scale:.2f}x')

        logging.info("OCR preprocessing steps: %s", ', '.join(steps_applied))
        return gray
    except Exception as e:
        logging.error(f"Error preprocessing image: {e}")
        return image


def should_enable_preprocessing_step(env_name, default=False):
    truthy = {'1', 'true', 'yes', 'on'}
    fallback = 'true' if default else 'false'
    return (os.environ.get(env_name, fallback) or fallback).strip().lower() in truthy


def auto_orient_image(image):
    """Rotate image based on OCR orientation metadata when available."""
    try:
        osd = pytesseract.image_to_osd(image)
        match = re.search(r"Rotate:\s+(\d+)", osd)
        if match:
            angle = int(match.group(1)) % 360
            if angle:
                return image.rotate(-angle, expand=True)
    except Exception as orientation_error:
        logging.debug("OSD orientation detection skipped: %s", orientation_error)
    return image


def determine_ocr_language(file_path=None):
    default_lang = (os.environ.get('OCR_DEFAULT_LANG') or 'hun+eng').strip()
    filename = os.path.basename(file_path or '').lower()

    for hint, lang_code in LANGUAGE_HINTS.items():
        if hint in filename:
            logging.info("Detected OCR language hint '%s' from filename: %s", hint, lang_code)
            return lang_code

    return default_lang


def get_ocr_provider_chain():
    chain = (os.environ.get('OCR_PROVIDER_CHAIN') or 'google_vision,tesseract').split(',')
    normalized = []
    for provider in chain:
        provider_name = provider.strip().lower()
        if provider_name:
            normalized.append(provider_name)
    return normalized or ['tesseract']


def _build_google_credentials_info_from_env():
    credentials_json = (os.environ.get('GOOGLE_APPLICATION_CREDENTIALS_JSON') or '').strip()
    if credentials_json:
        parsed = json.loads(credentials_json)
        if isinstance(parsed, dict):
            return parsed
        raise ValueError('GOOGLE_APPLICATION_CREDENTIALS_JSON must contain a JSON object')

    extracted = {}
    for field in GOOGLE_SERVICE_ACCOUNT_FIELDS:
        value = (os.environ.get(field) or '').strip()
        if value:
            extracted[field] = value

    if extracted:
        if 'private_key' in extracted:
            extracted['private_key'] = extracted['private_key'].replace('\\n', '\n')
        missing_required = [
            key for key in ['type', 'project_id', 'private_key', 'client_email', 'token_uri']
            if not extracted.get(key)
        ]
        if missing_required:
            raise ValueError(
                f"Missing Google credentials fields in environment: {', '.join(missing_required)}"
            )
        return extracted

    return None


def _provider_min_quality(provider):
    specific = os.environ.get(f'OCR_MIN_QUALITY_SCORE_{provider.upper()}')
    if specific is not None:
        return float(specific)
    return float(os.environ.get('OCR_MIN_QUALITY_SCORE', '0.40'))


def should_force_ocr_provider_failures():
    truthy = {'1', 'true', 'yes', 'on'}
    return (os.environ.get('OCR_STRICT_PROVIDER', 'false') or 'false').strip().lower() in truthy


def run_ocr_with_fallback(image, lang, providers):
    best_text = ''
    best_meta = {'provider': 'none', 'quality_score': 0.0, 'reason': 'no_provider_ran', 'text_length': 0}
    strict_mode = should_force_ocr_provider_failures()

    if 'google_vision' in providers:
        verify_google_vision_configuration()

    for provider in providers:
        text = ''
        provider_meta = {'provider': provider, 'status': 'unknown', 'reason': 'unknown', 'error': ''}
        if provider == 'tesseract':
            text, provider_meta = run_tesseract_ocr(image, lang)
        elif provider == 'google_vision':
            text, provider_meta = run_google_vision_ocr(image, lang)
        elif provider == 'ocr_space':
            text, provider_meta = run_ocr_space_ocr(image, lang)
        else:
            logging.warning("Unknown OCR provider '%s' in OCR_PROVIDER_CHAIN", provider)
            continue

        quality = calculate_text_quality(text)
        text_length = len((text or '').strip())
        reason = provider_meta.get('reason', 'unknown')
        logging.info(
            "OCR provider=%s status=%s text_length=%s quality=%.3f reason=%s",
            provider,
            provider_meta.get('status', 'unknown'),
            text_length,
            quality,
            reason,
        )

        if quality > best_meta['quality_score']:
            best_text = text
            best_meta = {
                'provider': provider,
                'quality_score': quality,
                'reason': reason,
                'text_length': text_length,
                'status': provider_meta.get('status', 'unknown'),
            }

        if strict_mode and provider_meta.get('status') not in {'ok', 'skipped'}:
            raise RuntimeError(
                f"OCR strict mode is enabled and provider '{provider}' failed: "
                f"{provider_meta.get('status')} ({provider_meta.get('error') or provider_meta.get('reason')})"
            )

        if provider == 'google_vision' and text.strip() and provider_meta.get('status') == 'ok':
            return text, {'provider': provider, 'quality_score': quality, 'reason': 'google_vision_text_found'}

        min_quality = _provider_min_quality(provider)
        if text.strip() and quality >= min_quality:
            return text, {'provider': provider, 'quality_score': quality, 'reason': 'quality_threshold_met'}

        if not text.strip():
            logging.info("OCR fallback from provider=%s due to reason=empty_text", provider)
        else:
            logging.info(
                "OCR fallback from provider=%s due to reason=quality_below_threshold (%.3f < %.3f)",
                provider,
                quality,
                min_quality,
            )

    return best_text, best_meta


def run_tesseract_ocr(image, lang):
    psm = os.environ.get('OCR_TESSERACT_PSM', '6')
    oem = os.environ.get('OCR_TESSERACT_OEM', '3')
    config = f'--oem {oem} --psm {psm}'
    try:
        text = pytesseract.image_to_string(image, lang=lang, timeout=40, config=config)
        return text, {'provider': 'tesseract', 'status': 'ok', 'reason': 'success', 'error': ''}
    except Exception as tesseract_error:
        logging.warning('Tesseract OCR failed: %s: %s', type(tesseract_error).__name__, tesseract_error)
        return '', {
            'provider': 'tesseract',
            'status': 'api_error',
            'reason': 'exception',
            'error': f'{type(tesseract_error).__name__}: {tesseract_error}',
        }


def map_ocr_lang_to_vision_hints(lang):
    if not lang:
        return ['hu', 'en']

    tokens = [token.strip().lower() for token in lang.replace(',', '+').split('+') if token.strip()]
    hints = []
    for token in tokens:
        mapped = VISION_LANGUAGE_HINTS.get(token)
        if not mapped and len(token) == 2:
            mapped = token
        if mapped and mapped not in hints:
            hints.append(mapped)

    if not hints:
        return ['hu', 'en']
    return hints


def get_google_vision_client():
    global _GOOGLE_VISION_CLIENT, _GOOGLE_VISION_CLIENT_ERROR
    with _GOOGLE_VISION_CLIENT_LOCK:
        if _GOOGLE_VISION_CLIENT is not None:
            return _GOOGLE_VISION_CLIENT
        if _GOOGLE_VISION_CLIENT_ERROR is not None:
            raise RuntimeError(_GOOGLE_VISION_CLIENT_ERROR)

        try:
            credentials_info = _build_google_credentials_info_from_env()
            if credentials_info:
                credentials = service_account.Credentials.from_service_account_info(credentials_info)
                _GOOGLE_VISION_CLIENT = vision.ImageAnnotatorClient(credentials=credentials)
            else:
                _GOOGLE_VISION_CLIENT = vision.ImageAnnotatorClient()
            return _GOOGLE_VISION_CLIENT
        except Exception as client_error:
            _GOOGLE_VISION_CLIENT_ERROR = f'{type(client_error).__name__}: {client_error}'
            raise


def classify_google_vision_error(error):
    message = str(error).lower()
    if 'permission' in message or '403' in message:
        return 'permission_error'
    if 'credential' in message or 'service account' in message or 'auth' in message or '401' in message:
        return 'auth_error'
    if 'timed out' in message or 'deadline exceeded' in message or 'timeout' in message:
        return 'timeout'
    return 'api_error'


def verify_google_vision_configuration():
    try:
        get_google_vision_client()
        logging.info('Google Vision client initialized successfully')
        return {'ok': True, 'reason': 'client_initialized'}
    except Exception as config_error:
        error_text = f'{type(config_error).__name__}: {config_error}'
        logging.warning(
            'Google Vision client initialization failed (%s). Check GOOGLE_APPLICATION_CREDENTIALS(_JSON) or service account fields.',
            error_text,
        )
        return {'ok': False, 'reason': 'client_init_failed', 'error': error_text}


def run_google_vision_ocr(image, lang):
    timeout = float(os.environ.get('OCR_GOOGLE_VISION_TIMEOUT', '20'))
    language_hints = map_ocr_lang_to_vision_hints(lang)

    buffer = BytesIO()
    image.save(buffer, format='PNG')
    image_bytes = buffer.getvalue()

    try:
        client = get_google_vision_client()
        response = client.document_text_detection(
            image=vision.Image(content=image_bytes),
            image_context=vision.ImageContext(language_hints=language_hints),
            timeout=timeout,
        )
        if response.error.message:
            logging.warning('Google Vision OCR failed: %s', response.error.message)
            return '', {
                'provider': 'google_vision',
                'status': 'api_error',
                'reason': 'api_error',
                'error': response.error.message,
            }
        text = (response.full_text_annotation.text or '').strip()
        if not text:
            return '', {
                'provider': 'google_vision',
                'status': 'ok',
                'reason': 'empty_text',
                'error': '',
            }
        return text, {'provider': 'google_vision', 'status': 'ok', 'reason': 'success', 'error': ''}
    except Exception as api_error:
        category = classify_google_vision_error(api_error)
        logging.warning('Google Vision OCR failed: %s: %s', type(api_error).__name__, api_error)
        return '', {
            'provider': 'google_vision',
            'status': category,
            'reason': 'exception',
            'error': f'{type(api_error).__name__}: {api_error}',
        }


def run_ocr_space_ocr(image, lang):
    api_key = (os.environ.get('OCR_SPACE_API_KEY') or '').strip()
    if not api_key:
        logging.info('OCR.space fallback skipped (OCR_SPACE_API_KEY missing)')
        return '', {'provider': 'ocr_space', 'status': 'skipped', 'reason': 'missing_api_key', 'error': ''}

    lang_map = {
        'hun': 'hun',
        'eng': 'eng',
        'eng+hun': 'eng',
    }
    ocr_space_lang = lang_map.get(lang, 'eng')
    endpoint = os.environ.get('OCR_SPACE_ENDPOINT', 'https://api.ocr.space/parse/image')

    buffer = BytesIO()
    image.save(buffer, format='PNG')
    image_bytes = buffer.getvalue()

    boundary = '----CodexFormBoundary7MA4YWxkTrZu0gW'
    fields = {
        'apikey': api_key,
        'language': ocr_space_lang,
        'isOverlayRequired': 'false',
        'OCREngine': os.environ.get('OCR_SPACE_ENGINE', '2'),
    }

    body = []
    for key, value in fields.items():
        body.extend([
            f'--{boundary}'.encode(),
            f'Content-Disposition: form-data; name="{key}"'.encode(),
            b'',
            str(value).encode(),
        ])
    body.extend([
        f'--{boundary}'.encode(),
        b'Content-Disposition: form-data; name="file"; filename="scan.png"',
        b'Content-Type: image/png',
        b'',
        image_bytes,
        f'--{boundary}--'.encode(),
        b'',
    ])
    payload = b'\r\n'.join(body)

    req = request.Request(
        endpoint,
        data=payload,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
        method='POST',
    )
    timeout = float(os.environ.get('OCR_SPACE_TIMEOUT', '20'))

    try:
        with request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode('utf-8', errors='ignore')
        payload = json.loads(raw)
        parsed_results = payload.get('ParsedResults') or []
        text = '\n'.join((item.get('ParsedText') or '') for item in parsed_results)
        if not text.strip():
            return '', {'provider': 'ocr_space', 'status': 'ok', 'reason': 'empty_text', 'error': ''}
        return text, {'provider': 'ocr_space', 'status': 'ok', 'reason': 'success', 'error': ''}
    except Exception as api_error:
        logging.warning('OCR.space fallback failed: %s: %s', type(api_error).__name__, api_error)
        return '', {
            'provider': 'ocr_space',
            'status': 'api_error',
            'reason': 'exception',
            'error': f'{type(api_error).__name__}: {api_error}',
        }


def calculate_text_quality(text):
    if not text:
        return 0.0

    cleaned = text.strip()
    if not cleaned:
        return 0.0

    chars = len(cleaned)
    letters = sum(1 for ch in cleaned if ch.isalpha())
    spaces = sum(1 for ch in cleaned if ch.isspace())
    noise = sum(1 for ch in cleaned if not (ch.isalnum() or ch.isspace() or ch in ',.;:!?()/-'))
    diacritics = sum(1 for ch in cleaned if ch in 'áéíóöőúüűÁÉÍÓÖŐÚÜŰ')
    garbage_hits = sum(len(re.findall(pattern, cleaned)) for pattern in GARBAGE_PATTERNS)

    alpha_ratio = letters / chars
    space_ratio = spaces / chars
    noise_ratio = noise / chars
    diacritic_ratio = diacritics / max(letters, 1)

    score = 0.55 * alpha_ratio
    score += 0.20 * min(space_ratio * 3, 1)
    score += 0.15 * (1 - min(noise_ratio * 4, 1))
    score += 0.10 * min(diacritic_ratio * 8, 1)
    score -= min(garbage_hits * 0.03, 0.30)

    return max(0.0, min(1.0, score))

def test_ocr():
    """Test OCR functionality"""
    try:
        test_image = Image.new('RGB', (200, 100), color='white')
        _ = pytesseract.image_to_string(test_image, lang=determine_ocr_language())
        return True
    except Exception as e:
        logging.error(f"OCR test failed: {e}")
        return False
