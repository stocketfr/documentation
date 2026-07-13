# Development Setup

This guide creates the coordinated multi-repository checkout used for Stocket
development.

## Prerequisites

- Git; `jj` is optional and used automatically for new clones when available
- Node.js 22
- pnpm 10.28.0 (Corepack is recommended)
- Docker with the Compose plugin
- a classic GitHub token with `read:packages`
- Infisical CLI access to the Stocket development environment
- Nix with flakes, `just`, and Loggle are optional conveniences

Python 3.12 and MkDocs are needed only when working on documentation. Rust and
Tauri system libraries are needed only for the desktop shell.

## Authenticate to GitHub Packages

Backend and frontend install immutable shared packages from GitHub Packages.
Even public packages require npm registry authentication. Export the token as
`GITHUB_PACKAGES_TOKEN` through a hidden prompt or secret manager; never type
the literal value into command history.

```bash
# GITHUB_PACKAGES_TOKEN must already be exported securely.
pnpm config set --global @stocketfr:registry https://npm.pkg.github.com
pnpm config set --global //npm.pkg.github.com/:_authToken "${GITHUB_PACKAGES_TOKEN}"
unset GITHUB_PACKAGES_TOKEN
```

Do not commit the token. GitHub Actions uses its short-lived `GITHUB_TOKEN`.

## Clone and Bootstrap

Choose an empty parent directory, clone `meta`, then let its manifest assemble
the checkout:

```bash
git clone https://github.com/stocketfr/meta.git
./meta/scripts/bootstrap
```

Bootstrap performs the following operations:

1. reads `meta/repos.yaml` and clones/fetches `packages`, `backend`, `frontend`,
   `remote-desktop`, `documentation`, and `landing` as siblings of `meta`;
2. links workspace-root configuration from `meta/root/`;
3. installs the root pnpm workspace and any repository-local dependency sets;
4. builds projects that expose a bootstrap-time `build` script.

It does not clone `infrastructure`; clone that repository separately when
working on hosted operations. A `mobile-app` workspace slot exists in the root
template, but there is no active mobile repository in the manifest.

Rerun bootstrap after `repos.yaml`, root workspace configuration, or shared
dependency topology changes. Use `./meta/scripts/clone-or-update` when you only
need to fetch the managed repositories.

## Environment Configuration

`backend/env.template` and `frontend/env.template` document consumed keys. They
are reference files, not local secret sources. Normal project scripts invoke
Infisical:

```bash
infisical login
```

Your account/project setup must provide the keys described in
[Environment Variables](../reference/environment-variables.md). In particular,
the API requires database, tenancy, Better Auth, and object-storage values; the
web process requires its internal API and host configuration.

!!! warning "No checked-in `.env` workflow"
    The current `justfile`s do not contain a `just env` recipe and the template
    is named `env.template`, not `.env.template`. Do not copy older commands
    that export Infisical into a tracked or long-lived `.env` file.

## Start the Standard Stack

From the workspace parent:

```bash
./meta/scripts/dev
```

When Loggle is installed and no optional processes are requested, the script
uses `meta/.loggle.toml`. Otherwise it starts processes directly. Docker-backed
PostgreSQL and MinIO are started whenever Docker is available, followed by the
API and frontend.

!!! warning "Current Loggle graph"
    `meta/.loggle.toml` currently invokes `@stocket/web dev:workspace`, but the
    frontend has no such package script. If Loggle is installed, use
    [Run Projects Individually](#run-projects-individually) until the meta
    configuration is corrected. The direct runner uses the valid frontend
    `dev` script.

| Service | Local endpoint | Purpose |
|---------|----------------|---------|
| PostgreSQL | `localhost:5432` | tenant, auth, inventory, audit, and task data |
| MinIO S3 API | `http://localhost:9000` | product photos and background-task inputs |
| MinIO console | `http://localhost:9001` | local object inspection (`minio` / `minio123`) |
| Effect API | `http://localhost:8080` | API, auth, health, and partial Swagger UI |
| TanStack Start | `http://localhost:3000` | platform-host web application |

Useful variants:

```bash
./meta/scripts/dev --include-docs
./meta/scripts/dev --include-desktop
```

`--with-docker` is a stale option and has no current effect. The direct runner
already attempts to start PostgreSQL and MinIO.

### Run the Task Worker

The standard meta process graph does not currently launch the background task
worker. Run it in another terminal when testing asynchronous product imports:

```bash
cd backend
pnpm start:worker
```

The API and worker use the same database and object-storage configuration.

## Run Projects Individually

Start infrastructure without the meta process runner:

```bash
docker compose -f meta/docker-compose.yml up -d --wait postgres minio
docker compose -f meta/docker-compose.yml up minio-init
```

Then start application processes in separate terminals:

```bash
cd backend
pnpm start:workspace
```

```bash
cd frontend
pnpm dev
```

`start:workspace` supplies safe local database, host, CORS, MinIO, and seed
defaults around Infisical-provided secrets. For normal backend-only development,
`pnpm start` uses the Infisical environment without those workspace overrides.

## Seed a Tenant and Demo Data

With PostgreSQL available and migrations applied, run:

```bash
cd backend
pnpm tenant:seed:workspace
```

With no target, the recipe creates the default tenant only when none exist,
selects the only tenant, or prompts when several exist. It creates/rotates
`tenant-admin@stocket.fr` with password `admin1234`, seeds default roles, and
replaces that tenant's demo categories, suppliers, products, locations,
clients, inventory, orders, stock movements, and audit logs. For a deliberate
existing target, set `TENANT_ADMIN_TENANT_SLUG` or `TENANT_ADMIN_TENANT_ID`.

!!! danger "Destructive within the selected tenant"
    The tenant seed clears and recreates demo data for its selected tenant. Do
    not point it at data you need to preserve.

On a new database, open `http://stocket.localhost:3000` for the created default
tenant. Otherwise use the selected tenant's slug/hostname. The platform console
remains at `http://localhost:3000` and requires a platform superadmin.

## Optional Nix Shells

Backend, frontend, packages, documentation, and infrastructure provide their
own flakes. Enter the shell from the repository you are changing:

```bash
cd backend
nix develop
```

There is no canonical root flake for the assembled checkout.

## Common Repository Checks

```bash
# Backend
cd backend
pnpm type-check
pnpm lint
pnpm test
pnpm test:integration

# Frontend
cd frontend
pnpm type-check
pnpm lint
pnpm format:check
pnpm test:unit

# Shared packages
cd packages
pnpm build
```

Use [CLI Commands](../reference/cli-commands.md) for the complete script map and
[Troubleshooting](../reference/troubleshooting.md) for registry, host, database,
and object-storage failures.
