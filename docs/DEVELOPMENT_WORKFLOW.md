# Development Workflow

## Branching convention

- `main` contains code ready for the current milestone demonstration.
- New work uses short-lived branches named `feature/<area>`, `fix/<area>`, or
  `docs/<area>`; for example, `feature/public-profile` or
  `fix/agreement-validation`.
- A branch is merged only after the test commands relevant to its changes pass
  and the other teammate has reviewed it.

## Commit convention

Use an imperative, scoped summary:

```text
feature: add public reputation profile
fix: reject invalid agreement participant IDs
test: cover JWT validation and security headers
docs: add milestone 2 threat model
```

Keep each commit focused on one change. Do not commit `.env` files, keypair JSON,
seed phrases, generated build files, or database dumps.

## Review and merge convention

1. Open a pull request from the feature/fix/docs branch.
2. The non-author uses `docs/MILESTONE_2_PEER_REVIEW.md` and records findings.
3. Resolve requested changes, run the verification commands, and merge into
   `main`.
4. Create an annotated milestone tag only after all required deliverables are
   committed.

## Release convention

Existing releases are tagged `milestone-0` and `milestone-1`. Create the next
release after the Milestone 2 changes are committed:

```sh
git tag -a milestone-2 -m "Project Milestone 2"
git push origin main --tags
```
