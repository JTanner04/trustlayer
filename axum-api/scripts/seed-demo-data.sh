#!/usr/bin/env bash
# Seeds two demonstration accounts and sample agreements/reviews through the API.
# Requires a running local API. Safe to re-run: exits early if already seeded.
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:3001}"
DEMO_PASSWORD="trustlayer-demo-2026"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

json_value() {
  node -e 'const fs=require("fs"); const value=process.argv[2].split(".").reduce((obj,key)=>obj[key], JSON.parse(fs.readFileSync(process.argv[1], "utf8"))); process.stdout.write(String(value));' "$1" "$2"
}

register() {
  curl -sS -o "$3" -w '%{http_code}' \
    -H 'Content-Type: application/json' \
    --data "{\"email\":\"$1\",\"password\":\"$DEMO_PASSWORD\",\"display_name\":\"$2\"}" \
    "$API_BASE_URL/auth/register"
}

# post <token> <path> <output> [json-body]
post() {
  if [ -n "${4:-}" ]; then
    curl -sS -o "$3" -w '%{http_code}' -X POST \
      -H 'Content-Type: application/json' -H "Authorization: Bearer $1" \
      --data "$4" "$API_BASE_URL$2"
  else
    curl -sS -o "$3" -w '%{http_code}' -X POST \
      -H "Authorization: Bearer $1" "$API_BASE_URL$2"
  fi
}

expect() {
  [ "$2" = "$1" ] || fail "$3 returned HTTP $2 (expected $1): $(cat "$4" 2>/dev/null)"
  echo "OK: $3"
}

curl -fsS "$API_BASE_URL/health" > /dev/null || fail "API is not reachable at $API_BASE_URL"

STATUS="$(register "alice@demo.trustlayer.test" "Alice Rivera" "$TMP_DIR/alice.json")"
if [ "$STATUS" = "409" ]; then
  echo "Demo accounts already exist; nothing to seed."
  exit 0
fi
expect 201 "$STATUS" "register Alice" "$TMP_DIR/alice.json"
STATUS="$(register "bob@demo.trustlayer.test" "Bob Chen" "$TMP_DIR/bob.json")"
expect 201 "$STATUS" "register Bob" "$TMP_DIR/bob.json"

ALICE_TOKEN="$(json_value "$TMP_DIR/alice.json" token)"
ALICE_ID="$(json_value "$TMP_DIR/alice.json" user.id)"
BOB_TOKEN="$(json_value "$TMP_DIR/bob.json" token)"
BOB_ID="$(json_value "$TMP_DIR/bob.json" user.id)"

curl -sS -o /dev/null -X PUT -H 'Content-Type: application/json' -H "Authorization: Bearer $ALICE_TOKEN" \
  --data '{"display_name":"Alice Rivera","bio":"Freelance web designer focused on accessible small-business sites."}' \
  "$API_BASE_URL/profiles/$ALICE_ID"
curl -sS -o /dev/null -X PUT -H 'Content-Type: application/json' -H "Authorization: Bearer $BOB_TOKEN" \
  --data '{"display_name":"Bob Chen","bio":"Backend developer who builds APIs and data pipelines."}' \
  "$API_BASE_URL/profiles/$BOB_ID"
echo "OK: profile bios"

# 1. Completed agreement with reviews in both directions.
STATUS="$(post "$ALICE_TOKEN" /agreements "$TMP_DIR/a1.json" \
  "{\"participant_id\":\"$BOB_ID\",\"title\":\"Landing page redesign\",\"description\":\"Responsive redesign of the company landing page.\"}")"
expect 201 "$STATUS" "create completed agreement" "$TMP_DIR/a1.json"
A1="$(json_value "$TMP_DIR/a1.json" id)"
expect 200 "$(post "$BOB_TOKEN" "/agreements/$A1/accept" "$TMP_DIR/r.json")" "accept completed agreement" "$TMP_DIR/r.json"
expect 200 "$(post "$ALICE_TOKEN" "/agreements/$A1/complete" "$TMP_DIR/r.json")" "complete agreement" "$TMP_DIR/r.json"
# Build JSON bodies first: bash 3.2 (macOS) brace-expands them when nested in "$(...)".
BODY="{\"agreement_id\":\"$A1\",\"rating\":5,\"review_text\":\"Bob delivered the API integration early and communicated clearly.\"}"
expect 201 "$(post "$ALICE_TOKEN" /reviews "$TMP_DIR/r.json" "$BODY")" "Alice reviews Bob" "$TMP_DIR/r.json"
BODY="{\"agreement_id\":\"$A1\",\"rating\":4,\"review_text\":\"Clear requirements and quick feedback from Alice.\"}"
expect 201 "$(post "$BOB_TOKEN" /reviews "$TMP_DIR/r.json" "$BODY")" "Bob reviews Alice" "$TMP_DIR/r.json"

# 2. Accepted agreement that is still in progress.
STATUS="$(post "$ALICE_TOKEN" /agreements "$TMP_DIR/a2.json" \
  "{\"participant_id\":\"$BOB_ID\",\"title\":\"Checkout API integration\",\"description\":\"Connect the storefront to the payment API.\"}")"
expect 201 "$STATUS" "create in-progress agreement" "$TMP_DIR/a2.json"
A2="$(json_value "$TMP_DIR/a2.json" id)"
expect 200 "$(post "$BOB_TOKEN" "/agreements/$A2/accept" "$TMP_DIR/r.json")" "accept in-progress agreement" "$TMP_DIR/r.json"

# 3. Pending invitation from Bob that Alice has not accepted yet.
STATUS="$(post "$BOB_TOKEN" /agreements "$TMP_DIR/a3.json" \
  "{\"participant_id\":\"$ALICE_ID\",\"title\":\"Dashboard UI refresh\",\"description\":\"Refresh the admin dashboard styles.\"}")"
expect 201 "$STATUS" "create pending invitation" "$TMP_DIR/a3.json"

echo
echo "Demo data seeded. Log in at http://localhost:3000/login with:"
echo "  alice@demo.trustlayer.test / $DEMO_PASSWORD"
echo "  bob@demo.trustlayer.test   / $DEMO_PASSWORD"
echo "Public profiles: /profiles/$ALICE_ID and /profiles/$BOB_ID"
