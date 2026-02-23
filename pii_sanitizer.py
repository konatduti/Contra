"""Utilities for sanitizing text by replacing PII with placeholders."""

from __future__ import annotations

import re
from typing import Dict, Tuple

# Regex patterns targeting common PII fields in contracts. The patterns are
# intentionally simple so they run quickly without large NLP models while
# covering the most typical structures we encounter in Hungarian and English
# contracts.
PATTERNS = {
    "company name": re.compile(r"(?<=egyrészről a )([^\n]+)", re.IGNORECASE),
    "address": re.compile(r"székhelye/lakhelye: ([^\n]+)", re.IGNORECASE),
    "governing organization": re.compile(
        r"cégjegyzéket vezető bíróság: ([^\n]+)", re.IGNORECASE
    ),
    "company registry number": re.compile(
        r"cégjegyzékszáma: ([^\n]+)", re.IGNORECASE
    ),
    "tax identification number": re.compile(r"adószáma: ([^\n]+)", re.IGNORECASE),
    "representative": re.compile(r"képviseli: ([^\n]+)", re.IGNORECASE),
    # Generic email detector used in some contracts
    "email": re.compile(r"([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)"),
}


def sanitize_text(text: str) -> Tuple[str, Dict[str, str]]:
    """Replace detected PII with descriptive placeholders.

    The sanitizer is deliberately lightweight: it relies on a handful of regex
    patterns rather than heavyweight NLP models. Each match is replaced with a
    placeholder of the form ``[Party 1 <label>]`` and a mapping of placeholders
    to original values is returned alongside the sanitized text.
    """

    mapping: Dict[str, str] = {}
    sanitized = text

    for label, pattern in PATTERNS.items():
        def repl(match: re.Match[str]) -> str:
            placeholder = f"[Party 1 {label}]"
            mapping[placeholder] = match.group(1).strip()
            return match.group(0).replace(match.group(1), placeholder)

        sanitized = re.sub(pattern, repl, sanitized)

    return sanitized, mapping


__all__ = ["sanitize_text"]
