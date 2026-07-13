# Installation

This procedure creates a local multi-repository checkout and starts the
platform, a tenant application, PostgreSQL, and MinIO.

## 1. Configure GitHub Packages

Create a classic GitHub token with `read:packages`. Export it as
`GITHUB_PACKAGES_TOKEN` through a hidden shell prompt or secret manager—do not
type the token into command history—then configure pnpm:

```bash
# GITHUB_PACKAGES_TOKEN must already be exported securely.
pnpm config set --global @stocketfr:registry https://npm.pkg.github.com
pnpm config set --global //npm.pkg.github.com/:_authToken "${GITHUB_PACKAGES_TOKEN}"
unset GITHUB_PACKAGES_TOKEN
```

## 2. Clone the Workspace Controller

From an empty parent directory:

```bash
git clone https://github.com/stocketfr/meta.git
./meta/scripts/bootstrap
```

`meta/repos.yaml` clones the managed repositories beside `meta` and the
bootstrap links the local root workspace configuration. The infrastructure
repository is intentionally separate and is not cloned by this command.

## 3. Authenticate to Infisical

The backend and frontend scripts inject runtime values through Infisical:

```bash
infisical login
```

The checked-in files are named `backend/env.template` and
`frontend/env.template`. They document keys but are not meant to become the
local source of truth. See [Configuration](configuration.md).

## 4. Start the Stack

```bash
./meta/scripts/dev
```

The script starts PostgreSQL, MinIO and its local bucket, the Node.js Effect
API, and the TanStack Start web process. Loggle is used when available;
otherwise output is prefixed by process. The historical `--with-docker` flag is
not required and has no current effect.

!!! warning "Loggle users"
    The current `meta/.loggle.toml` calls a missing frontend `dev:workspace`
    script. Until it is fixed, [run the projects separately](../development/setup.md#run-projects-individually)
    when Loggle is installed.

For asynchronous imports, run the worker separately:

```bash
cd backend
pnpm start:worker
```

## 5. Seed a Local Tenant

After the API has applied development migrations:

```bash
cd backend
pnpm tenant:seed:workspace
```

With no target, this creates the default tenant only when none exist, selects
the only tenant, or prompts when several exist. It creates/rotates
`tenant-admin@stocket.fr` with password `admin1234` and replaces the selected
tenant's demo data. Set `TENANT_ADMIN_TENANT_SLUG` or
`TENANT_ADMIN_TENANT_ID` to target an existing tenant explicitly.

!!! danger "Tenant data is replaced"
    Do not run the workspace seed against a tenant whose data must be kept.

## 6. Verify the Installation

| Check | URL |
|-------|-----|
| API liveness | `http://localhost:8080/health-check/live` |
| API readiness | `http://localhost:8080/health-check/ready` |
| Partial Swagger UI | `http://localhost:8080/docs` |
| Platform web host | `http://localhost:3000` |
| Default tenant on a new database | `http://stocket.localhost:3000` |
| MinIO console | `http://localhost:9001` |

Swagger currently describes only the health group implemented with Effect
`HttpApiBuilder`; it is not a complete endpoint catalog.

## Optional Nix Shell

Several repositories have their own flake. For example:

```bash
cd backend
nix develop
```

There is no root flake for the assembled workspace. For manual process startup,
advanced credentials, and troubleshooting, see
[Development Setup](../development/setup.md).
