# Milestone 2 Peer Review Record

Complete one review for each teammate's changes before submission. This is the
evidence record for the course deliverable; do not mark an item complete unless
the reviewer actually inspected it.

## Review A - Jeremiah's changes

- Author: Jeremiah Tanner
- Reviewer: Jailin West
- Date: November 2, 2026
- Commit/PR reviewed: `3bdeee7` ("JT Milestone 2") — https://github.com/JTanner04/trustlayer/commit/3bdeee77647a6dbc44c13968c1f896b75492bcf2
- Method: read the full diff (backend validation, CORS, security headers, JWT
  secret check, unit tests, integration/coverage scripts, sign-out, public
  profile page, docs), then ran the code against a disposable PostgreSQL
  database and probed edge cases with `curl`. Review was AI-assisted (Claude
  Code ran the probes and drafted notes); results below were reproduced locally.

| Check | Result | Notes |
| --- | --- | --- |
| Authorization and agreement/review state checks | [x] Pass | Probed with a third, unrelated account: it cannot read (404), accept (400), or complete (400) someone else's agreement, cannot review it (403), and cannot edit another user's profile (403). Creator cannot accept their own invitation (400). Review before completion is rejected (403). Unauthenticated `GET /agreements` returns 401. |
| Input validation and error handling | [x] Pass with notes | 11-character password rejected (400); duplicate email with different case rejected (409); oversized body rejected (413). See findings A1–A3. |
| JWT/CORS/security-header changes | [x] Pass | `JWT_SECRET=short` stops startup with the documented message. All five security headers present on `/health`. CORS (including an `OPTIONS` preflight from `https://evil.example`) only ever returns `access-control-allow-origin: http://localhost:3000`. Invalid/forged bearer tokens return 401. |
| Unit/integration test changes | [x] Pass with notes | `cargo test`: 6 passed. `cargo clippy -- -D warnings`: clean. `scripts/test-api-flow.sh`: all 10 steps pass. See finding A4. |
| Documentation and no committed secrets | [x] Pass | Scanned every file in the full git history: no `.env`, keypair JSON, `.pem`, or private-key blocks. Docs match behavior except the CORS verification wording, which was corrected (finding A5). |

### Findings

None are blocking for Milestone 2.

- **A1 — Passwords longer than 72 bytes are silently truncated (low).** bcrypt
  only uses the first 72 bytes. Reproduced: registered with 72 `p` characters +
  `AAAA`, then logged in successfully with 72 `p` characters + `ZZZZ`. Suggested
  fix: reject passwords over 72 bytes in `validate_registration` (or use
  bcrypt's non-truncating hash). Proposed for Milestone 3.
- **A2 — Length limits count bytes, not characters (low).** A display name of 50
  accented characters (`é` × 50 = 100 bytes) is rejected with "must be between 1
  and 80 characters". Suggested fix: use `.chars().count()` for user-facing
  limits.
- **A3 — Wallet address format is not checked server-side (low).** The UI says
  32–44 base58 characters, but the API accepted `not-base58!!` (200). Suggested
  fix: validate base58 and length in `validate_profile`.
- **A4 — Unit test gaps (low).** The registration test only exercises a bad
  email, though the docs say it covers password and display-name rules; the
  JWT test is named "rejects bad or missing tokens" but never sends a missing
  header or an expired token; the security-header test does not assert the
  CSP header. Suggested fix: add those assertions to raise coverage.
- **A5 — CORS verification step was inaccurate (resolved).** This document said
  to "confirm no allow-origin response", but the API always returns the
  configured origin and the browser blocks the mismatch. Wording corrected in
  the security table below.
- **Nits:** a non-participant accepting/completing gets 400 rather than 403
  (still correctly blocked); the public profile page shows a generic error page
  if the API is unreachable; the short-secret check uses `assert!`, which
  prints a panic message rather than a clean startup error.

Reviewer sign-off: Jailin West (JW)

## Review B - Jailin's changes

- Author: Jailin West
- Reviewer: **[Jeremiah: add name]**
- Date: **[add date]**
- Commit/PR reviewed: **[add commit hash or pull-request URL]**

### Changes submitted for review

| Area | Change | Files |
| --- | --- | --- |
| Session handling (bug fix) | Signed-out visitors to any workspace page (`/dashboard`, `/agreements`, `/settings`, …) are redirected to `/login` on the server instead of seeing an empty "Welcome back, ." page. An expired or invalid session cookie (API returns 401) also redirects to `/login` on the client. | `frontend/app/(workspace)/layout.tsx`, `frontend/app/components/workspace/preview-context.tsx` |
| Demo/seed data | New script creates two demo accounts (Alice, Bob) with a completed agreement and reviews in both directions, an in-progress agreement, and a pending invitation. Uses the API so passwords are hashed and validation applies; safe to re-run. | `axum-api/scripts/seed-demo-data.sh`, `README.md`, `axum-api/README.md` |
| Homepage footer | Replaced the outdated "Frontend preview · in development" footer with a copyright line; removed an undefined CSS class. | `frontend/app/page.tsx` |
| Cleanup | Workspace tab title changed from "Workspace preview" to "Workspace"; removed the leftover create-next-app `README 2.md`. | `frontend/app/(workspace)/layout.tsx`, `frontend/README 2.md` |
| Documentation | Milestone 2 report (setup changes, TA verification for each required check, evidence index, recorded test output); corrected CORS verification wording; changelog entries; this review and the cross-viewport results. | `docs/MILESTONE_2_REPORT.md`, `docs/MILESTONE_2_PEER_REVIEW.md`, `CHANGELOG.md` |

How to verify: run the seed script, log in as `alice@demo.trustlayer.test` /
`trustlayer-demo-2026`, sign out, then open `/dashboard` — it should redirect to
`/login`. With a fake `trustlayer_session` cookie, `/dashboard` should also end
on `/login`. Frontend `npx tsc --noEmit`, `npm run lint`, and `npm run build`
pass with no errors or warnings.

| Check | Result | Notes |
| --- | --- | --- |
| Responsive layout and accessibility | [ ] Pass | |
| API integration and sign-in/sign-out behavior | [ ] Pass | |
| Public profile and verification UI | [ ] Pass | |
| Frontend build/type/lint results | [ ] Pass | |
| Documentation and no exposed sensitive data | [ ] Pass | |

Findings/resolution: **[add findings or “No blocking findings.”]**

Reviewer sign-off: **[add name/initials]**

## Cross-viewport testing evidence

Record actual device/browser checks here. A screenshot or short recording may be
linked in the Notes column.

Checked in a Chromium browser with viewport emulation, logged in as the seeded
demo account. "No horizontal scroll" means the page width never exceeded the
viewport.

| Viewport/browser | Pages checked | Result | Tester/date | Notes or evidence link |
| --- | --- | --- | --- | --- |
| Desktop, 1440 px, Chromium | Login, dashboard, new-agreement form, public profile | [x] Pass | Jailin West, Nov 2, 2026 | Sidebar layout; no horizontal scroll; dashboard shows live seeded data. Screenshots: [dashboard](screenshots/desktop-dashboard.webp), [new agreement](screenshots/desktop-new-agreement.webp), [public profile](screenshots/desktop-public-profile.webp), [login](screenshots/desktop-login.webp) |
| Tablet, 768 px, Chromium | Login, sidebar/navigation, new-agreement form, public profile | [x] Pass | Jailin West, Nov 2, 2026 | Sidebar stays visible; stat cards in 2 columns; no horizontal scroll. Screenshots: [dashboard](screenshots/tablet-dashboard.webp), [new agreement](screenshots/tablet-new-agreement.webp), [public profile](screenshots/tablet-public-profile.webp), [login](screenshots/tablet-login.webp) |
| Mobile, 390 px, Chromium | Login, navigation, new-agreement form, public profile | [x] Pass | Jailin West, Nov 2, 2026 | Sidebar becomes a top link bar; forms and profile stack to one column; no page-level horizontal scroll. The dashboard agreements table scrolls sideways inside its own card by design. Screenshots: [dashboard](screenshots/mobile-dashboard.png), [new agreement](screenshots/mobile-new-agreement.png), [public profile](screenshots/mobile-public-profile.png), [login](screenshots/mobile-login.png) |

## Security before-and-after evidence

| Control | Before Milestone 2 | After Milestone 2 | Verification |
| --- | --- | --- | --- |
| API CORS | `CorsLayer::permissive()` accepted any origin. | Only `FRONTEND_ORIGIN` is allowed; default is local Next.js. | Inspect `axum-api/src/main.rs` `cors_layer`; run `curl -s -D - -o /dev/null -H "Origin: https://evil.example" http://127.0.0.1:3001/health` and confirm `access-control-allow-origin` is only `http://localhost:3000` (the configured origin), never the requesting origin or `*`, so browsers block the unapproved site. |
| Response headers | No explicit anti-framing/content-sniffing/cache headers. | API sends `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, CSP, `Referrer-Policy`, and `Cache-Control: no-store`. | `security_headers_prevent_embedding_and_content_sniffing` unit test; optionally inspect `curl -I /health` while API is running. |
| Input size | Unbounded application-level text fields and default body limit. | 16 KiB request limit plus bounded email/profile/agreement/review validation. | Unit validation tests and malformed/oversized request checks. |
| JWT secret | Any nonempty environment value was accepted. | Backend refuses secrets shorter than 32 characters. | Start API with a short `JWT_SECRET` and confirm startup fails with the documented message. |
| Workspace session handling | Signed-out or expired sessions saw an empty workspace shell ("Welcome back, .") with failed data requests. | Missing session redirects to `/login` server-side; a 401 from the API redirects to `/login` client-side. | Sign out, then open `/dashboard`; or set a fake `trustlayer_session` cookie and open `/dashboard`. Both end on `/login`. |
