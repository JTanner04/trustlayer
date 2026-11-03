# Milestone 2 Coverage Report

## Result

| Scope | Line coverage | Function coverage | Region coverage |
| --- | ---: | ---: | ---: |
| `axum-api/src/main.rs` | **37.40%** | **30.00%** | **36.16%** |

Measurement date: November 2, 2026.

The Milestone 2 baseline target is **30% line coverage** across the backend's
single application module. The project intentionally keeps this initial target
modest because the same module includes live PostgreSQL and Solana RPC code;
those paths require external services and are exercised by the separate
two-account integration workflow rather than mocked as unit tests.

The target is met. Security-critical pure logic is specifically covered for
input validation, self-agreement prevention, JWT validation, and security
response headers. Future work should extract database and Solana adapters into
separate modules, which will permit a higher unit-coverage target without
pretending network/database code is unit tested.

## Reproducing the report

On macOS with Xcode command-line tools installed:

```sh
cd axum-api
bash scripts/coverage.sh
```

## Test inventory

- Registration email/password/display-name validation, including bcrypt's
  72-byte maximum password input
- Agreement title limits and self-agreement prevention
- Review rating/text validation
- Profile field limits and Solana wallet public-key format
- JWT acceptance plus malformed, missing, and expired-token rejection
- Security-header middleware behavior, including CSP

The full workflow is additionally covered by
`axum-api/scripts/test-api-flow.sh` against a disposable PostgreSQL database.
