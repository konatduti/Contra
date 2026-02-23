import os
import sys
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from llm_pii_sanitizer import sanitize_text_llm
from pii_restorer import restore_text
from app import app, db
from models import User, Document, Analysis
from routes import process_document
from encryption_utils import decrypt_value


def test_llm_sanitizer_detects_pii():
    text_hu = "John Doe lakik Budapesten. Email: john@example.com"
    text_en = "Contact Jane Smith via jane@example.com"
    side_effect = [
        [
            {"text": "John Doe", "type": "name"},
            {"text": "john@example.com", "type": "email"},
        ],
        [
            {"text": "Jane Smith", "type": "name"},
            {"text": "jane@example.com", "type": "email"},
        ],
    ]
    with patch("llm_pii_sanitizer._extract_entities", side_effect=side_effect):
        sanitized_hu, mapping_hu = sanitize_text_llm(text_hu)
        sanitized_en, mapping_en = sanitize_text_llm(text_en)
    assert "[Party 1 name]" in sanitized_hu
    assert mapping_hu["[Party 1 email]"] == "john@example.com"
    assert "[Party 1 name]" in sanitized_en
    assert mapping_en["[Party 1 name]"] == "Jane Smith"


def test_restorer_reinserts_originals():
    text = "John Doe signed. Email: john@example.com"
    entities = [
        {"text": "John Doe", "type": "name"},
        {"text": "john@example.com", "type": "email"},
    ]
    with patch("llm_pii_sanitizer._extract_entities", return_value=entities):
        sanitized, mapping = sanitize_text_llm(text)
    restored = restore_text(sanitized, mapping)
    assert restored == text


def test_admin_toggle_bypasses_sanitizer(tmp_path):
    with app.app_context():
        db.drop_all()
        db.create_all()

        user = User(username="u", email="u@e", password_hash="x")
        db.session.add(user)
        db.session.commit()

        doc = Document(
            filename="f.txt",
            original_filename="f.txt",
            file_type="txt",
            user_id=user.id,
        )
        db.session.add(doc)
        db.session.commit()

        analysis = Analysis(document_id=doc.id)
        db.session.add(analysis)
        db.session.commit()

        fake_text = "John Doe email john@example.com"
        with patch("routes.extract_text_from_file", return_value=fake_text), \
            patch("routes.analyze_document", return_value={}), \
            patch("routes.PlatformSetting.get", return_value="false"), \
            patch("routes.sanitize_text_llm") as mock_sanitize:
            process_document(doc.id, str(tmp_path / "f.txt"), "txt")
        mock_sanitize.assert_not_called()
        refreshed = Analysis.query.filter_by(document_id=doc.id).first()
        assert refreshed.extracted_text is None
        assert decrypt_value(refreshed.encrypted_extracted_text) == fake_text
