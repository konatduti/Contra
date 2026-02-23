import json
import sys
from pathlib import Path

import pytest

sys.path.append(str(Path(__file__).resolve().parent.parent))


@pytest.fixture(autouse=True)
def _restore_lookup_flag(monkeypatch):
    monkeypatch.setenv("IP_GEOLOCATION_LOOKUP_ENABLED", "1")
    yield


def test_lookup_ip_location_uses_http_fallback(monkeypatch):
    import routes

    routes._IP_LOCATION_CACHE.clear()
    monkeypatch.setattr(routes, "DbIpCity", None)

    class DummyResponse:
        status = 200

        def __init__(self, payload):
            self._payload = payload

        def read(self):
            return json.dumps(self._payload).encode("utf-8")

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

    def fake_urlopen(url, *, timeout):
        assert "8.8.8.8" in url
        assert timeout == routes._IPAPI_TIMEOUT
        return DummyResponse(
            {
                "city": "Test City",
                "region": "Test Region",
                "country_name": "Testland",
            }
        )

    monkeypatch.setattr(routes.urllib.request, "urlopen", fake_urlopen)

    label = routes.lookup_ip_location("8.8.8.8")
    assert label == "Test City, Test Region, Testland"

    # Ensure the value is cached to avoid repeated HTTP lookups.
    cached = routes.lookup_ip_location("8.8.8.8")
    assert cached == label
