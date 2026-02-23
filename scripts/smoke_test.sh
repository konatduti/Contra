#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:${PORT:-5000}}"
COOKIE_JAR="${COOKIE_JAR:-/tmp/contra_cookie.txt}"

printf 'Using backend: %s\n' "$BASE_URL"

echo "1) Health"
curl -sS "$BASE_URL/health" | jq .

echo "2) Session-required endpoints (expect 401 when unauthenticated)"
curl -i -sS "$BASE_URL/api/v1/me" | head -n 1
curl -i -sS "$BASE_URL/api/v1/dashboard" | head -n 1
curl -i -sS "$BASE_URL/api/v1/documents" | head -n 1

echo "3) Optional login then authenticated checks"
if [[ -n "${CONTRA_USERNAME:-}" && -n "${CONTRA_PASSWORD:-}" ]]; then
  curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE_URL/login" \
    -d "username=$CONTRA_USERNAME" -d "password=$CONTRA_PASSWORD" >/dev/null

  curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" "$BASE_URL/api/v1/me" | jq .
  curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" "$BASE_URL/api/v1/dashboard" | jq .
  curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" "$BASE_URL/api/v1/documents" | jq .
else
  echo "Set CONTRA_USERNAME and CONTRA_PASSWORD to run authenticated checks."
fi
