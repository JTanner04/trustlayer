# TrustLayer - Milestone 2: Test It

## Scope completed

Milestone 2 expands the MVP with a shareable public profile page at
`/profiles/{userId}` and strengthens the application around the existing
registration, agreement, review, and Solana-verification workflow.

This milestone also adds unit tests, a repeatable API integration workflow,
code-review guidance, a threat model, an OWASP-focused assessment, and security
controls.

Supporting evidence:

- [Coverage report](MILESTONE_2_COVERAGE.md)
- [Peer review and cross-viewport evidence record](MILESTONE_2_PEER_REVIEW.md)
- [Branching and release conventions](DEVELOPMENT_WORKFLOW.md)
- [Project changelog](../CHANGELOG.md)

## Test plan and evidence

### Automated unit tests

From `axum-api`:

```sh
cargo test
cargo clippy -- -D warnings
```

The unit suite verifies:

| Test | Behavior covered |
| --- | --- |
| Registration validation | Rejects malformed email input and enforces password/display-name requirements. |
| Agreement validation | Blocks self-agreements and oversized titles. |
| Review validation | Blocks invalid ratings and oversized review text. |
| JWT authentication | Accepts a valid signed token and rejects a malformed bearer token. |
| Security headers | Verifies anti-framing, anti-content-sniffing, referrer, and no-store headers. |

The measured backend coverage is **37.40% lines** and **30.00% functions**,
meeting the documented 30% Milestone 2 baseline target. See the coverage report
for the command, scope, and target justification.

### API integration workflow

Start the backend against a disposable PostgreSQL database **without
`SOLANA_KEYPAIR_PATH` set**, then run:

```sh
cd axum-api
bash scripts/test-api-flow.sh
```

The script creates fresh accounts and verifies this end-to-end API sequence:

1. Health check succeeds.
2. Both accounts register.
3. Account A creates an agreement for Account B.
4. Completion is rejected before the invited participant accepts.
5. Account B accepts the agreement.
6. Account A completes the agreement.
7. Account A creates a review.
8. A duplicate review from Account A is rejected with HTTP 409.
9. The public verification endpoint returns the review record.

The integration run adds temporary test accounts to the configured database, so
use a disposable local database for grading or development.

### Manual browser checks

1. Register two accounts in separate sessions (normal browser plus private
   window, or use Sign out between accounts).
2. Complete the agreement workflow and verify the agreement status changes
   only after acceptance.
3. Submit a review and open the public profile link in Profile Settings.
4. Confirm the public profile displays reputation summary and review status
   without requiring login.
5. When a funded Devnet signer is configured, confirm a verified review has a
   Solana Explorer link. Without a signer, the UI must truthfully show `failed`.

## Code-review checklist

Each pull request should be reviewed by the other teammate before merging.

- [ ] No secrets, `.env` files, seed phrases, or keypair JSON files are tracked.
- [ ] Authentication/authorization is checked for every protected endpoint.
- [ ] User-controlled input has server-side validation and bounded length.
- [ ] Agreement and review state transitions cannot be bypassed.
- [ ] Errors do not reveal passwords, tokens, key paths, or database internals.
- [ ] New behavior has a test or a documented manual verification step.
- [ ] `cargo test`, `cargo clippy -- -D warnings`, frontend type-check, and
  frontend lint pass.
- [ ] README and submission documentation are updated when behavior changes.

## Threat model

### Assets

- Password hashes and authenticated session tokens
- PostgreSQL profile, agreement, and review data
- Solana Devnet signer file and its Devnet funds
- Reputation integrity and the review-to-agreement relationship

### Trust boundaries

1. Browser to Next.js: session cookie and form data.
2. Next.js to Axum API: server-side bearer-token proxy.
3. Axum API to PostgreSQL: persisted application data.
4. Axum API to Solana RPC: signed Devnet memo transaction.
5. Public profile and verification endpoints: anonymous read access.

### Threats and mitigations

| Threat | Risk | Mitigation implemented | Remaining consideration |
| --- | --- | --- | --- |
| Credential theft or weak passwords | Account takeover | bcrypt password hashing, 12-character minimum, HttpOnly/SameSite cookie | Add password reset and MFA in a future release. |
| Forged/expired JWT | Unauthorized access | HS256 signature validation, 24-hour expiry, minimum 32-character JWT secret | Add token revocation/rotation for production. |
| Cross-origin browser requests | CSRF/data exposure | API CORS limited to `FRONTEND_ORIGIN`; session cookie is SameSite=Lax | Use HTTPS and a CSRF token strategy if cross-site form flows are introduced. |
| Oversized or malformed input | Resource exhaustion/data-quality issues | 16 KiB API body limit plus server-side field length and format validation | Add edge/proxy rate limiting in deployment. |
| Unauthorized workflow transition | Fake reputation records | Participant checks, acceptance-before-completion, completed-before-review, one review per reviewer/agreement | Add audit events and moderation tools for a larger release. |
| On-chain privacy leak | Permanent exposure of PII | Only a SHA-256 digest of review metadata is written to Solana; never review text, email, password, or key material | Document data retention and consent policies before public launch. |
| Signer/keypair leakage | Unauthorized Devnet transaction signing | Keypair is external to repo; `.gitignore` rejects common key formats; examples use placeholders | Use a managed signer/key vault and least-privilege service account in production. |

## OWASP Top 10 assessment

| OWASP category | Assessment | Milestone 2 action |
| --- | --- | --- |
| A01 Broken Access Control | Relevant | API verifies identity for protected routes and ownership/participation for profile updates, agreements, and reviews. |
| A02 Cryptographic Failures | Relevant | bcrypt hashes passwords; secrets/keypairs stay out of source control; JWT secret has a 32-character minimum. |
| A03 Injection | Relevant | SQLx parameter binding is used for database values; no string-built SQL accepts user values. |
| A04 Insecure Design | Relevant | Agreement state machine requires invitation acceptance before completion and completion before review. |
| A05 Security Misconfiguration | Relevant | Permissive CORS was replaced with a single configurable frontend origin; security response headers are sent by both API/frontend. |
| A06 Vulnerable Components | Ongoing | Lockfiles are committed; review dependency advisories before release. |
| A07 Identification and Authentication Failures | Relevant | Password length, bcrypt, JWT expiration, and secure HttpOnly session handling are enforced. |
| A08 Software and Data Integrity Failures | Relevant | Review uniqueness and state constraints protect records; Devnet signature is persisted after confirmation. |
| A09 Security Logging and Monitoring Failures | Partially addressed | Axum request tracing logs failures without logging secrets; production monitoring/alerting remains a Milestone 3 deployment task. |
| A10 Server-Side Request Forgery | Low current exposure | Users cannot supply RPC URLs or arbitrary server-side URLs; RPC is configured by environment. |

## Security changes in this milestone

- Replaced permissive API CORS with `FRONTEND_ORIGIN` (default:
  `http://localhost:3000`).
- Added API response headers: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, Content Security Policy, and no-store cache policy.
- Added frontend response headers: `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, and restrictive browser permissions.
- Enforced a minimum JWT secret length of 32 characters at backend startup.
- Added a 16 KiB request-body limit and bounded all user-controlled text fields.
- Added email, profile, agreement, and review validation before database writes.
- Added a clear Sign out action to safely switch accounts in a shared browser.

## Milestone 2 submission checklist

- [ ] Run the unit suite and capture its passing output.
- [ ] Run the integration script against a disposable database and capture its
  passing output.
- [ ] Have each teammate complete the code-review checklist for the other
  teammate's changes.
- [ ] Add both team contribution statements and any required video link to the
  course report.
- [ ] Commit all code and documents, then create the required Milestone 2 tag
  when the course instructions specify its name.
