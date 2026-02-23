import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from pii_sanitizer import sanitize_text
from pii_restorer import restore_text


def test_sanitize_and_restore_round_trip():
    original = (
        "Munkaszerződés\n\n"
        "Amely létrejött egyrészről a Nova Technologies Kft.\n"
        "székhelye/lakhelye: Göd, hunyadi utca 13.\n"
        "cégjegyzéket vezető bíróság: Mucsaröcsögei Törvényszék Cégbírósága\n"
        "cégjegyzékszáma: 01-6574\n"
        "adószáma: 12845378-2\n"
        "képviseli: Dr. Nagy Péter\n"
    )

    sanitized, mapping = sanitize_text(original)

    assert "[Party 1 company name]" in sanitized
    assert mapping["[Party 1 company name]"] == "Nova Technologies Kft."

    restored = restore_text(sanitized, mapping)
    assert restored == original
