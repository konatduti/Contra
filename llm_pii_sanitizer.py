"""LLM-driven PII sanitizer."""
from __future__ import annotations

import json
import os
import re
from typing import Dict, List, Tuple

try:  # optional dependency so tests can patch extractor without model
    from llama_cpp import Llama  # type: ignore
except Exception:  # pragma: no cover - handled in tests
    Llama = None  # type: ignore

_MODEL: Llama | None = None

_PROMPT = (
    "Identify PII entities in Hungarian or English text and return JSON "
    '[{"text":…, "type":…}].\n\n{text}\n'
)


def _get_model() -> Llama:
    """Load (or reuse) the small CPU-friendly model."""
    if Llama is None:
        raise RuntimeError("llama-cpp-python is not installed")

    global _MODEL
    if _MODEL is None:
        model_path = os.environ.get(
            "LLM_PII_SANITIZER_MODEL",
            (
                "deepseek-ai/DeepSeek-R1-Distilled-Qwen-1.5B-GGUF/"
                "DeepSeek-R1-Distilled-Qwen-1.5B-Q4_K_M.gguf"
            ),
        )
        _MODEL = Llama(model_path=model_path, n_ctx=4096)
    return _MODEL


def _extract_entities(text: str) -> List[Dict[str, str]]:
    """Call the LLM and parse JSON entity list."""
    llm = _get_model()
    prompt = _PROMPT.format(text=text)
    output = llm(prompt, max_tokens=512, temperature=0)
    generated = output["choices"][0]["text"]
    start, end = generated.find("["), generated.rfind("]")
    if start != -1 and end != -1:
        try:
            return json.loads(generated[start : end + 1])
        except json.JSONDecodeError:
            return []
    return []


def sanitize_text_llm(text: str) -> Tuple[str, Dict[str, str]]:
    """Replace detected entities with placeholders.

    Returns sanitized text and a mapping from placeholders to originals.
    """
    entities = _extract_entities(text)
    sanitized = text
    mapping: Dict[str, str] = {}
    for ent in entities:
        original = ent.get("text", "")
        ent_type = ent.get("type", "pii")
        placeholder = f"[Party 1 {ent_type}]"
        sanitized = re.sub(re.escape(original), placeholder, sanitized, count=1)
        mapping[placeholder] = original
    return sanitized, mapping


__all__ = ["sanitize_text_llm"]
