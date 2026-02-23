"""Utility helpers for encrypting and decrypting sensitive analysis data."""

import base64
import os
from functools import lru_cache
from hashlib import sha256
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken


def _derive_key() -> bytes:
    """Return a valid Fernet key from configuration or a deterministic fallback."""
    configured = os.environ.get("TRAINING_DATA_KEY")
    if configured:
        key = configured.encode("utf-8")
        try:
            Fernet(key)  # validate provided key
            return key
        except (ValueError, TypeError):
            pass
    # Deterministic fallback for development environments so restarts keep data readable.
    secret = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
    digest = sha256(secret.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


@lru_cache(maxsize=1)
def _get_cipher() -> Fernet:
    return Fernet(_derive_key())


def encrypt_value(value: Optional[str]) -> Optional[str]:
    """Encrypt a string using Fernet, returning a UTF-8 safe token."""
    if value is None:
        return None
    if value == "":
        return ""
    cipher = _get_cipher()
    token = cipher.encrypt(value.encode("utf-8"))
    return token.decode("utf-8")


def decrypt_value(token: Optional[str]) -> str:
    """Decrypt a Fernet token back to a UTF-8 string."""
    if not token:
        return ""
    cipher = _get_cipher()
    try:
        value = cipher.decrypt(token.encode("utf-8"))
        return value.decode("utf-8")
    except (InvalidToken, ValueError, TypeError):
        return ""
