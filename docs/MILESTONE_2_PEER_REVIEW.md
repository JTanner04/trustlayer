# Milestone 2 Peer Review Record

Complete one review for each teammate's changes before submission. This is the
evidence record for the course deliverable; do not mark an item complete unless
the reviewer actually inspected it.

## Review A - Jeremiah's changes

- Author: Jeremiah Tanner
- Reviewer: **[Jailin: add name]**
- Date: **[add date]**
- Commit/PR reviewed: **[add commit hash or pull-request URL]**

| Check | Result | Notes |
| --- | --- | --- |
| Authorization and agreement/review state checks | [ ] Pass | |
| Input validation and error handling | [ ] Pass | |
| JWT/CORS/security-header changes | [ ] Pass | |
| Unit/integration test changes | [ ] Pass | |
| Documentation and no committed secrets | [ ] Pass | |

Findings/resolution: **[add findings or “No blocking findings.”]**

Reviewer sign-off: **[add name/initials]**

## Review B - Jailin's changes

- Author: Jailin West
- Reviewer: **[Jeremiah: add name]**
- Date: **[add date]**
- Commit/PR reviewed: **[add commit hash or pull-request URL]**

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

| Viewport/browser | Pages checked | Result | Tester/date | Notes or evidence link |
| --- | --- | --- | --- | --- |
| Desktop, 1440 px+, Chrome/Safari | Login, dashboard, agreement flow, public profile | [ ] Pass | | |
| Tablet, 768 px | Login, sidebar/navigation, forms, public profile | [ ] Pass | | |
| Mobile, 390 px | Login, sidebar/navigation, agreement form, public profile | [ ] Pass | | |

## Security before-and-after evidence

| Control | Before Milestone 2 | After Milestone 2 | Verification |
| --- | --- | --- | --- |
| API CORS | `CorsLayer::permissive()` accepted any origin. | Only `FRONTEND_ORIGIN` is allowed; default is local Next.js. | Inspect `axum-api/src/main.rs` `cors_layer`; send an `Origin` header from an unapproved origin and confirm no allow-origin response. |
| Response headers | No explicit anti-framing/content-sniffing/cache headers. | API sends `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, CSP, `Referrer-Policy`, and `Cache-Control: no-store`. | `security_headers_prevent_embedding_and_content_sniffing` unit test; optionally inspect `curl -I /health` while API is running. |
| Input size | Unbounded application-level text fields and default body limit. | 16 KiB request limit plus bounded email/profile/agreement/review validation. | Unit validation tests and malformed/oversized request checks. |
| JWT secret | Any nonempty environment value was accepted. | Backend refuses secrets shorter than 32 characters. | Start API with a short `JWT_SECRET` and confirm startup fails with the documented message. |
