"""Utility to restore original PII values from placeholders."""
from __future__ import annotations

from typing import Dict


def restore_text(text: str, mapping: Dict[str, str]) -> str:
    """Replace placeholders in ``text`` using ``mapping`` produced by ``sanitize_text``.

    Parameters
    ----------
    text: str
        Text possibly containing placeholders like ``[Party 1 company name]``.
    mapping: Dict[str, str]
        Mapping from placeholders to their original values.
    """
    restored = text
    for placeholder, original in mapping.items():
        restored = restored.replace(placeholder, original)
    return restored


__all__ = ["restore_text"]
