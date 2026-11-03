#!/usr/bin/env bash
# Requires a running local API and a disposable PostgreSQL database.
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:3001}"
TMP_DIR="$(mktemp -d)"
RUN_ID="$(date +%s)-$RANDOM"
trap 'rm -rf "$TMP_DIR"' EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

expect_status() {
  local expected="$1"
  local actual="$2"
  local label="$3"
  [ "$actual" = "$expected" ] || fail "$label returned HTTP $actual (expected $expected)"
  echo "PASS: $label"
}

json_value() {
  node -e 'const fs=require("fs"); const value=process.argv[2].split(".").reduce((obj,key)=>obj[key], JSON.parse(fs.readFileSync(process.argv[1], "utf8"))); process.stdout.write(String(value));' "$1" "$2"
}

register() {
  local email="$1"
  local name="$2"
  local output="$3"
  curl -sS -o "$output" -w '%{http_code}' \
    -H 'Content-Type: application/json' \
    --data "{\"email\":\"$email\",\"password\":\"integration-password-123\",\"display_name\":\"$name\"}" \
    "$API_BASE_URL/auth/register"
}

curl -fsS "$API_BASE_URL/health" > "$TMP_DIR/health.json" || fail "API is not reachable at $API_BASE_URL"
grep -q '"status":"ok"' "$TMP_DIR/health.json" || fail "health endpoint did not return ok"
echo "PASS: health check"

STATUS="$(register "account-a-$RUN_ID@example.test" "Account A" "$TMP_DIR/account-a.json")"
expect_status 201 "$STATUS" "register Account A"
STATUS="$(register "account-b-$RUN_ID@example.test" "Account B" "$TMP_DIR/account-b.json")"
expect_status 201 "$STATUS" "register Account B"

TOKEN_A="$(json_value "$TMP_DIR/account-a.json" token)"
TOKEN_B="$(json_value "$TMP_DIR/account-b.json" token)"
USER_B="$(json_value "$TMP_DIR/account-b.json" user.id)"

STATUS="$(curl -sS -o "$TMP_DIR/agreement.json" -w '%{http_code}' \
  -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN_A" \
  --data "{\"participant_id\":\"$USER_B\",\"title\":\"Integration test agreement\",\"description\":\"Automated Milestone 2 workflow test\"}" \
  "$API_BASE_URL/agreements")"
expect_status 201 "$STATUS" "create agreement"
AGREEMENT_ID="$(json_value "$TMP_DIR/agreement.json" id)"

STATUS="$(curl -sS -o "$TMP_DIR/pre-accept-complete.json" -w '%{http_code}' \
  -X POST -H "Authorization: Bearer $TOKEN_A" "$API_BASE_URL/agreements/$AGREEMENT_ID/complete")"
expect_status 400 "$STATUS" "reject completion before acceptance"

STATUS="$(curl -sS -o "$TMP_DIR/accept.json" -w '%{http_code}' \
  -X POST -H "Authorization: Bearer $TOKEN_B" "$API_BASE_URL/agreements/$AGREEMENT_ID/accept")"
expect_status 200 "$STATUS" "accept agreement"

STATUS="$(curl -sS -o "$TMP_DIR/complete.json" -w '%{http_code}' \
  -X POST -H "Authorization: Bearer $TOKEN_A" "$API_BASE_URL/agreements/$AGREEMENT_ID/complete")"
expect_status 200 "$STATUS" "complete accepted agreement"

STATUS="$(curl -sS -o "$TMP_DIR/review.json" -w '%{http_code}' \
  -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN_A" \
  --data "{\"agreement_id\":\"$AGREEMENT_ID\",\"rating\":5,\"review_text\":\"Completed successfully during automated testing.\"}" \
  "$API_BASE_URL/reviews")"
expect_status 201 "$STATUS" "create review"
REVIEW_ID="$(json_value "$TMP_DIR/review.json" id)"

STATUS="$(curl -sS -o "$TMP_DIR/duplicate-review.json" -w '%{http_code}' \
  -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN_A" \
  --data "{\"agreement_id\":\"$AGREEMENT_ID\",\"rating\":5,\"review_text\":\"Duplicate review.\"}" \
  "$API_BASE_URL/reviews")"
expect_status 409 "$STATUS" "reject duplicate review"

STATUS="$(curl -sS -o "$TMP_DIR/verification.json" -w '%{http_code}' "$API_BASE_URL/reviews/$REVIEW_ID/verification")"
expect_status 200 "$STATUS" "read public verification record"

echo "Integration workflow passed."
