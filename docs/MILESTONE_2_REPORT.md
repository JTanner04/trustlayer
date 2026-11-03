# TrustLayer — Project Milestone 2 (Test It)

## 1. Working application and repository

- Repository: https://github.com/JTanner04/trustlayer
- Release tag: `milestone-2`
- Deployment URL: not deployed; the application runs locally using the
  instructions below. Deployment is planned for Milestone 3.
- Local URLs after startup:
  - Frontend: `http://localhost:3000`
  - API health check: `http://127.0.0.1:3001/health`

Milestone 2 builds on the Milestone 1 MVP (registration, agreements, consent,
completion, reviews, and Solana Devnet verification) with new features,
automated tests, and security hardening.

## 2. Features added in Milestone 2

| Feature | Description |
| --- | --- |
| Public reputation pages | Anyone can open `/profiles/{userId}` without logging in to see a member's average rating, received reviews, and verified-record count. Profile Settings links to the user's own public page. |
| Sign out | A workspace control clears the session cookie so a shared browser can switch accounts safely. |
| Demonstration data | `axum-api/scripts/seed-demo-data.sh` creates two demo accounts with completed, in-progress, and pending agreements plus reviews. |
| Security hardening | Restrictive CORS, security response headers, request-size limit, bounded input validation, and a minimum JWT secret length (see section 6). |

## 3. Setup changes since Milestone 1

Follow the repository [README](../README.md) for full setup. Changes since
Milestone 1:

- The API now requires `JWT_SECRET` to be **at least 32 characters**
  (`openssl rand -hex 32` satisfies this).
- Optional `FRONTEND_ORIGIN` (default `http://localhost:3000`) sets the only
  browser origin allowed by API CORS.
- No new migrations; `0001_initial.sql` and `0002_agreement_acceptance.sql`
  still apply automatically on startup.
- Optional seed data and demo accounts:

  ```sh
  cd axum-api
  bash scripts/seed-demo-data.sh
  ```

  | Account | Email | Password |
  | --- | --- | --- |
  | Alice Rivera | `alice@demo.trustlayer.test` | `trustlayer-demo-2026` |
  | Bob Chen | `bob@demo.trustlayer.test` | `trustlayer-demo-2026` |

## 4. TA verification instructions

### 4.1 The application starts

1. Start PostgreSQL, the API, and the frontend as described in the README.
2. Visit `http://127.0.0.1:3001/health` and confirm `{"status":"ok"}`.
3. Open `http://localhost:3000` and confirm the homepage loads.

### 4.2 The Milestone 1 workflow still works

1. Run `bash scripts/seed-demo-data.sh` from `axum-api`.
2. Log in as Alice. The dashboard shows one completed agreement, one in
   progress, and one pending invitation from Bob.
3. As Alice, open the pending **Dashboard UI refresh** invitation from Bob and
   select **Accept agreement**, then **Mark complete**.
4. As Alice, submit a review for Bob on that agreement and confirm it appears
   under Bob's received reviews.
5. Open the review's verification page. Without a Devnet signer it shows
   `Failed`; with one configured it shows `Verified` and a Solana Explorer link.

The original two-new-accounts flow from the Milestone 1 report also still works.

### 4.3 New Milestone 2 features work

1. As Alice, open **Profile Settings** and follow the public profile link.
2. Sign out, then reload the public profile URL. It still loads without login
   and shows the average rating and received reviews.
3. Log back in and use **Sign out** in the workspace navigation; confirm it
   returns to the login page and that visiting `/dashboard` (or any workspace
   page) afterward redirects to `/login`. An expired or invalid session also
   redirects to `/login`.

### 4.4 Automated tests run

```sh
cd axum-api
cargo test
cargo clippy -- -D warnings
```

Expected: `test result: ok. 6 passed; 0 failed` and no clippy warnings.

With the API running against a **disposable** database and no
`SOLANA_KEYPAIR_PATH` set:

```sh
bash scripts/test-api-flow.sh
```

Expected: ten `PASS:` lines ending in `Integration workflow passed.`

Frontend checks:

```sh
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all three complete with no errors.

### 4.5 Security controls can be observed

With the API running:

```sh
# Security headers on every response
curl -sI http://127.0.0.1:3001/health

# CORS only ever allows the configured frontend origin
curl -s -D - -o /dev/null -H "Origin: https://evil.example" http://127.0.0.1:3001/health

# Bodies over 16 KiB are rejected with HTTP 413
head -c 20000 /dev/zero | tr '\0' a | curl -s -o /dev/null -w '%{http_code}\n' \
  -H 'Content-Type: application/json' --data-binary @- http://127.0.0.1:3001/auth/register
```

Also start the API with `JWT_SECRET=short` and confirm it exits with
`JWT_SECRET must be at least 32 characters long`.

## 5. Test and quality evidence

| Deliverable | Location |
| --- | --- |
| QA plan and code-review checklist | [MILESTONE_2_TEST_AND_SECURITY.md](MILESTONE_2_TEST_AND_SECURITY.md) |
| Unit tests | `axum-api/src/main.rs` (`mod tests`) |
| Coverage report and justified target | [MILESTONE_2_COVERAGE.md](MILESTONE_2_COVERAGE.md) — 37.40% lines vs. 30% target |
| Integration tests for main user flow | `axum-api/scripts/test-api-flow.sh` |
| Peer code review evidence | [MILESTONE_2_PEER_REVIEW.md](MILESTONE_2_PEER_REVIEW.md) |
| Cross-viewport testing evidence | [MILESTONE_2_PEER_REVIEW.md](MILESTONE_2_PEER_REVIEW.md#cross-viewport-testing-evidence) |
| Branching and commit conventions | [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) |
| Changelog | [CHANGELOG.md](../CHANGELOG.md) |
| Tagged releases | `milestone-0`, `milestone-1`, `milestone-2` |

### Recorded test run (November 2, 2026)

```text
running 6 tests
test tests::review_requires_valid_rating_and_bounded_text ... ok
test tests::agreement_cannot_target_creator_or_exceed_limits ... ok
test tests::profile_validation_bounds_public_fields ... ok
test tests::registration_requires_valid_email_password_and_display_name ... ok
test tests::security_headers_prevent_embedding_and_content_sniffing ... ok
test tests::jwt_authentication_rejects_bad_or_missing_tokens ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

PASS: health check
PASS: register Account A
PASS: register Account B
PASS: create agreement
PASS: reject completion before acceptance
PASS: accept agreement
PASS: complete accepted agreement
PASS: create review
PASS: reject duplicate review
PASS: read public verification record
Integration workflow passed.
```

## 6. Security evidence

The threat model, OWASP Top 10 review, and implemented controls are in
[MILESTONE_2_TEST_AND_SECURITY.md](MILESTONE_2_TEST_AND_SECURITY.md).
Before-and-after evidence for each security fix is in
[MILESTONE_2_PEER_REVIEW.md](MILESTONE_2_PEER_REVIEW.md#security-before-and-after-evidence).

## 7. Demonstration

Demo video link: **[add link]**

Suggested outline: start the app, log in as a demo account, show the
Milestone 1 agreement → review flow, open a public profile while signed out,
run `cargo test` and the integration script, and show the security checks in
section 4.5.

## 8. Team contributions

- **Jeremiah Tanner:** Implemented the Axum backend and the Milestone 2 API
  hardening work, including validation, JWT and CORS safeguards, response
  headers, automated backend tests, coverage tooling, and the API integration
  flow. Also reviewed Jailin's Milestone 2 changes and documented the resulting
  findings in Review B.
- **Jailin West:** **[add 1–2 sentences]**
