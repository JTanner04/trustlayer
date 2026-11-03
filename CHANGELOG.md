# Changelog

All notable TrustLayer changes are documented here.

## [Unreleased] - Milestone 2

### Added

- Shareable public reputation pages at `/profiles/{userId}`.
- Sign out endpoint and workspace control for switching accounts safely.
- Backend unit suite, API workflow integration script, and coverage report.
- Milestone 2 QA, threat-model, OWASP, and peer-review documentation.

### Security

- Restrictive configurable API CORS via `FRONTEND_ORIGIN`.
- API/frontend security response headers and browser permissions policy.
- 16 KiB API request-body limit plus bounded server-side input validation.
- Minimum 32-character JWT secret requirement.
- Removed build-time dependency on externally fetched Google fonts.

## [milestone-1] - October 2026

### Added

- Registration/login, profiles, agreements, participant acceptance/completion,
  reviews, public verification data, and optional Solana Devnet memo records.
- PostgreSQL migrations and local setup/TA verification instructions.

## [milestone-0] - September 2026

### Added

- Project proposal, MVP scope, initial architecture, and product backlog.
