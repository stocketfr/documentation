# Testing

Tests belong to the repository that owns the behavior. Prefer the narrowest deterministic test, then add an integration or browser test when the boundary itself is part of the requirement.

## Backend suites

The backend uses Vitest on Node and recognizes these conventions:

| Pattern | Purpose | Default `pnpm test` |
| --- | --- | --- |
| `*.spec.ts` | Pure/unit/service/router tests | Yes |
| `*.effect.spec.ts` | Effect service/layer tests | Yes |
| `*.property.spec.ts` | Fast-check/property tests | Yes |
| `*.integration.spec.ts` | Real PostgreSQL integration | No; `pnpm test:integration` |

Canonical internal detail lives in `backend/TESTING.md` and `backend/src/effect/testing/README.md`.

Use `@effect/vitest`/`it.effect` for effects and construct layers that replace only the boundary under test. Test published request schemas and require realistic references—for example, a Product fixture must have a category. Assert tagged domain errors rather than matching incidental exception text.

### PostgreSQL integration

```bash
cd backend
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stocket_inventory_test \
  pnpm test:integration
```

The integration setup migrates once, runs serially, and truncates between tests. Never point it at a development or production database. Cover tenant isolation, constraints, transactions, concurrency, mutation contracts, and duplicate/idempotent requests where persistence behavior matters.

Audit logging is daemon-forked and best-effort. Integration tests that need an audit row must poll with the existing `waitForAuditLog` pattern; a fixed sleep or immediate assertion is flaky and still must not imply transactional completeness.

### Backend commands

```bash
pnpm test
pnpm test:watch
pnpm test:cov
pnpm test:integration
pnpm test:mutation:pure
pnpm test:duplicates
```

The optional MinIO storage smoke suite runs only when MinIO is available and
`RUN_MINIO_STORAGE_SMOKE=true` is set explicitly.

## Frontend unit tests

Vitest runs `src/**/*.test.ts` and `src/**/*.test.tsx` in jsdom.

```bash
cd frontend
pnpm test:unit
pnpm test:unit:watch
```

Test behavior through accessible names and user-visible state. Wrap components with the same query/router/i18n providers used by nearby tests. For data hooks, assert generated query keys, conditional `enabled` behavior, invalidation, and `{ data }` mutation variables without reaching through implementation internals.

Include permission and feature-gate cases for protected routes. SSR-sensitive helpers need cases for host, cookie, and forwarded-protocol handling without assuming `window` exists.

## Full-stack Playwright

```bash
cd frontend
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
```

The CI gate builds both applications and runs Chromium against a pinned backend revision, PostgreSQL 16, and LocalStack S3. Global setup provisions the E2E tenant/account through the protected seed path. Authentication setup is a separate Playwright project; most tests reuse its stored state, while authentication specs run independently.

Add an E2E test for critical cross-boundary behavior: account recovery, host/tenant resolution, permissions/features, product import tasks, file storage, or a workflow whose failure only appears in the browser/server interaction. Keep seed data explicit and tests safe to repeat.

When frontend and backend contracts change together, update the pinned `BACKEND_REF` only after the pair passes. A green test against a stale compatible backend is not evidence that the unpublished pair works.

## Shared packages, desktop, docs, and infrastructure

- `packages`: run `pnpm build`; run package tests such as `pnpm --filter @stocketfr/emails test`; verify generated type barrels before release.
- `remote-desktop`: run `pnpm test` and `pnpm lint`; the release pipeline remains experimental.
- `documentation`: validate relative links/navigation and let the PR gate run `mkdocs build --strict`.
- `infrastructure`: run Terraform formatting/validation, destroy-guard tests, Ansible syntax, and rendered-compose checks in its protected workflow.

## Before opening a pull request

Run the smallest relevant checks first, then the owning repository's type/lint suite. Report anything skipped and why. Do not replace a missing test with a statement that the code “looks correct.”
