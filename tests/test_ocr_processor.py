import importlib
import sys
import types
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


def load_ocr_module():
    fake_google = types.ModuleType('google')
    fake_google_cloud = types.ModuleType('google.cloud')
    fake_vision = types.ModuleType('google.cloud.vision')
    fake_google_oauth2 = types.ModuleType('google.oauth2')
    fake_service_account = types.ModuleType('google.oauth2.service_account')

    class DummyImageAnnotatorClient:
        def __init__(self, *args, **kwargs):
            pass

    class DummyVisionImage:
        def __init__(self, content=None):
            self.content = content

    class DummyVisionImageContext:
        def __init__(self, language_hints=None):
            self.language_hints = language_hints

    class DummyCredentials:
        @classmethod
        def from_service_account_info(cls, info):
            return cls()

    fake_vision.ImageAnnotatorClient = DummyImageAnnotatorClient
    fake_vision.Image = DummyVisionImage
    fake_vision.ImageContext = DummyVisionImageContext
    fake_service_account.Credentials = DummyCredentials

    sys.modules['google'] = fake_google
    sys.modules['google.cloud'] = fake_google_cloud
    sys.modules['google.cloud.vision'] = fake_vision
    sys.modules['google.oauth2'] = fake_google_oauth2
    sys.modules['google.oauth2.service_account'] = fake_service_account

    if 'ocr_processor' in sys.modules:
        return importlib.reload(sys.modules['ocr_processor'])
    return importlib.import_module('ocr_processor')


def test_pdf_uses_filename_language_hint(monkeypatch):
    ocr = load_ocr_module()
    seen = {}

    monkeypatch.setattr(ocr, 'convert_from_path', lambda *args, **kwargs: [Image.new('RGB', (10, 10), 'white')])
    monkeypatch.setattr(ocr, 'preprocess_image', lambda img: img)

    def fake_run(image, lang, providers):
        seen['lang'] = lang
        return 'sample text', {'provider': 'google_vision', 'quality_score': 0.9}

    monkeypatch.setattr(ocr, 'run_ocr_with_fallback', fake_run)
    monkeypatch.setattr(ocr, 'get_ocr_provider_chain', lambda: ['google_vision'])

    text = ocr.extract_text_from_pdf('invoice_en_2024.pdf')

    assert text == 'sample text'
    assert seen['lang'] == 'eng'


def test_google_vision_is_accepted_without_quality_gate(monkeypatch):
    ocr = load_ocr_module()

    monkeypatch.setattr(ocr, 'verify_google_vision_configuration', lambda: {'ok': True})
    monkeypatch.setattr(
        ocr,
        'run_google_vision_ocr',
        lambda image, lang: (
            'tiny',
            {'provider': 'google_vision', 'status': 'ok', 'reason': 'success', 'error': ''},
        ),
    )

    called = {'tesseract': False}

    def fail_tesseract(*args, **kwargs):
        called['tesseract'] = True
        return 'should-not-run', {'provider': 'tesseract', 'status': 'ok', 'reason': 'success', 'error': ''}

    monkeypatch.setattr(ocr, 'run_tesseract_ocr', fail_tesseract)
    monkeypatch.setattr(ocr, 'calculate_text_quality', lambda text: 0.01)

    text, meta = ocr.run_ocr_with_fallback(Image.new('RGB', (8, 8), 'white'), 'hun+eng', ['google_vision', 'tesseract'])

    assert text == 'tiny'
    assert meta['provider'] == 'google_vision'
    assert not called['tesseract']
