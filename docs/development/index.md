# Development

Stocket is developed as a coordinated checkout of independent repositories.
Start with `meta`, which clones the managed projects and assembles the local
pnpm workspace overlay.

## Start Here

- [Project and Module Map](project-map.md) — repository ownership, runtime
  modules, frontend routes, packages, and deployment status
- [Architecture](architecture.md) — runtime topology, tenancy, layering, and
  durable tasks
- [Development Setup](setup.md) — bootstrap, services, credentials, and local
  workflow
- [Code Style](code-style.md) — TypeScript, Effect, React, Oxlint, and formatting
- [Testing](testing.md) — unit, integration, full-stack, and docs checks
- [API Development](api-development.md) — backend module and HTTP patterns
- [Frontend Development](frontend-development.md) — TanStack Start, data,
  permissions, routing, and styling
- [CI/CD](ci-cd.md) — current repository workflows and release boundaries

## Repository Ownership

Use the repository that owns a change:

| Change | Repository |
|--------|------------|
| API, database, task worker, auth adapter | `backend` |
| Web routes, UI, SSR server, browser client | `frontend` |
| DTO/schema shared across repositories or email templates | `packages` |
| Checkout/bootstrap/local services | `meta` |
| Terraform/Ansible/host operations | `infrastructure` |
| Native shell | `remote-desktop` |
| Public docs | `documentation` |
| Marketing site | `landing` |

A feature can require coordinated pull requests. Shared contracts should land
through the package snapshot/stable-release workflow before consumers update
their pinned package versions.

## Typical Local Workflow

```bash
# From a directory that will contain all project repositories
git clone https://github.com/stocketfr/meta.git
./meta/scripts/bootstrap

# Start PostgreSQL, MinIO, API, and web processes
./meta/scripts/dev
```

The dev script selects Loggle when available; otherwise it uses its direct
runner. The checked-in Loggle graph currently calls the missing frontend
`dev:workspace` script, so Loggle users should use the manual process startup in
[Development Setup](setup.md#run-projects-individually) until it is fixed.
`--include-desktop`/`--include-docs` use the direct runner and add those
processes. Docker-backed PostgreSQL and MinIO are attempted automatically;
`--with-docker` is not a current mode switch.

For a focused change, enter the owning repository and use its scripts:

```bash
cd backend
pnpm type-check
pnpm lint
pnpm test
```

Root filters are also available after bootstrap, for example
`pnpm --filter @stocket/api type-check`, but repository-local commands match
each project's CI most directly.

## Cross-Repository Contract Changes

1. Modify `packages/<package>` and add a Changeset.
2. Use the package PR snapshot in coordinated backend/frontend branches.
3. Merge the package change and Changesets version PR.
4. Update the released version in each consumer.
5. Run consumer checks and the frontend full-stack Playwright gate when the API
   contract or behavior changed.

The published package is `@stocketfr/types`. Application source imports it
through the alias `@stocket/types`; do not use that alias as a pnpm workspace
filter.

## Before Opening a Pull Request

Run the smallest checks that prove your change, then the repository's standard
lint/type check. Add integration or E2E coverage for behavior crossing a
database, HTTP, or browser boundary. Update English and French documentation
together when public behavior changes.
