# Troubleshooting

Start with the process that owns the failing boundary. The workspace controller only coordinates repositories; backend, worker, frontend, PostgreSQL, and MinIO still have separate logs and health.

## Bootstrap cannot install `@stocketfr/*`

The shared packages are hosted on GitHub Packages.

1. Create or refresh a GitHub token with `read:packages`.
2. Configure the `@stocketfr` registry and token in your user-level npm configuration.
3. Run `pnpm install` again in the failing repository or rerun `./meta/scripts/bootstrap`.

Do not put the token in a repository `.npmrc`.

## Wrong Node or package manager

Backend and frontend target Node.js 22 and pnpm 10.28. Other repositories have
their own checked-in tool versions; some package and remote-desktop workflows
still use Node.js 20. Check the owning repository before changing versions:

```bash
node --version
pnpm --version
```

Enter the repository's Nix shell or enable Corepack if your versions differ. Bun is not the backend runtime.

## PostgreSQL or MinIO does not start

`./meta/scripts/dev` attempts to start both services automatically when Docker is available.

```bash
docker compose -f meta/docker-compose.yml ps
docker compose -f meta/docker-compose.yml logs postgres minio minio-init
```

Check that ports 5432, 9000, and 9001 are free. Verify the local bucket initializer completed before debugging photo/import failures.

!!! danger
    `docker compose down -v` deletes the local PostgreSQL volume and object-storage data. Do not use it as a routine restart command.

## API or worker fails during storage startup

The globally composed storage layer checks the bucket during startup, so invalid
or inaccessible storage normally prevents both the API and worker from
starting. All `S3_*` values must be present, the endpoint must be a valid URL,
and the configured bucket must already exist. Local MinIO normally needs
`S3_FORCE_PATH_STYLE=true`. Compare Infisical with `backend/env.template`;
editing a local `.env` will not change `pnpm start` unless you deliberately
changed the launcher.

## Loggle reports a missing frontend script

The current `meta/.loggle.toml` invokes `@stocket/web dev:workspace`, but the
frontend repository does not define that script. When Loggle is installed,
start PostgreSQL and MinIO from `meta/docker-compose.yml`, then run
`pnpm start:workspace` in `backend` and `pnpm dev` in `frontend`. The direct
meta runner already uses the valid frontend script, but `./meta/scripts/dev`
selects Loggle automatically when it is installed and no optional processes
were requested.

## Tenant route redirects or returns “tenant not found”

- Use `http://localhost:3000` for the platform console.
- Use `http://<slug>.localhost:3000` for a tenant.
- Confirm the slug exists in the platform console. Create a missing tenant there; the workspace seed targets existing tenants and only creates the default tenant when the database has none.
- Confirm the signed-in user has a membership in that tenant. Public account creation alone does not currently provision tenant membership.
- Keep `TENANT_BASE_DOMAIN` and `PLATFORM_HOST` aligned between frontend and backend.

## Login cookies fail through SSR or a proxy

The browser uses same-origin `/api/auth` and `/api/v1`; the SSR process forwards cookie, host, and protocol to `INTERNAL_API_ORIGIN`.

- Confirm `INTERNAL_API_ORIGIN` points to the backend from the frontend process.
- Set `TRUSTED_PROXY=1` only when a trusted reverse proxy supplies `x-forwarded-host` and `x-forwarded-proto`.
- Check `BETTER_AUTH_URL`, `FRONTEND_URL`, CORS origins, and any cookie domain together.
- Do not add `VITE_API_BASE_URL`; it is not used by the current architecture.

## Smart Import stays queued

The API only enqueues the durable PostgreSQL task. Start the separate worker:

```bash
cd backend
pnpm start:worker
```

Then inspect both API and worker logs. Validate `BACKGROUND_TASK_*`, PostgreSQL, and S3/MinIO. An absent `OPENAI_API_KEY` is not itself a failure—the importer falls back to deterministic proposals.

## Inventory and movement totals disagree

Inventory rows and the stock-movement ledger are currently independent. Recording a movement does not change inventory, and adjusting inventory does not add a movement. Correct the inventory row directly and record any required ledger entry separately; avoid assuming one is an automatic reconciliation of the other.

## A child area disappeared after deleting its parent

Do not delete a parent area while it still has children. The current database relation does not cascade or reparent descendants; they can become unreachable in the tree. Reparent or delete every child first. Inventory that referenced the deleted area loses its area assignment.

## Frontend validation fails

Run the checks independently to isolate the failure:

```bash
cd frontend
pnpm type-check
pnpm lint
pnpm format:check
pnpm test:unit
```

The active application lint command uses Oxlint. The separately published `@stocketfr/eslint-config` package does not mean the applications currently run ESLint.

## Backend checks fail

```bash
cd backend
pnpm type-check
pnpm lint
pnpm test
pnpm test:integration
```

Integration tests need a reachable PostgreSQL database and use `TEST_DATABASE_URL` when set. Keep unit and integration failures separate before changing configuration.

## API documentation looks incomplete

Swagger UI is at `http://localhost:8080/docs`, not `/api/docs`, and currently
documents only health. Mounted backend routers determine the live endpoints;
their matching `@stocketfr/types` schemas define payloads. Do not treat every
exported schema as a mounted route—for example, fulfillment remains an
unmounted prototype.

## French page falls back to English

The site uses suffix localization (`page.fr.md`) and falls back to English when a French file is absent. If a translation exists but is not selected, verify the suffix, the current locale selector, and that the page is present in `mkdocs.yml` navigation.

## Still blocked

Capture the failing command, repository name and revision, Node/pnpm versions, relevant process logs, and a redacted environment summary. Open an issue in the repository that owns the failure; use the documentation repository only for documentation defects.
