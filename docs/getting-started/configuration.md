# Configuration

Stocket configuration is split by process. Infisical is the operational source
for secrets; checked-in `env.template` files are references.

## Backend Processes

The API and task worker share database, tenant-host, object-storage, logging,
and observability configuration. The worker does not compose the auth layer,
but its current entry graph eagerly imports shared auth configuration. It
therefore needs Better Auth/frontend values and the staging/production email
configuration. The API additionally needs its HTTP port and CORS origins.
Smart Import can optionally call an OpenAI-compatible
API. Worker concurrency, leases, heartbeats, polling, recovery, retry, and
progress throttling are independently tunable.

The API validates `NODE_ENV` and `PORT` at entry. Required credentials such as
`DATABASE_URL`, `BETTER_AUTH_SECRET`, and S3 keys must be available before
their layers initialize.

See the complete [Environment Variable Reference](../reference/environment-variables.md).

## Frontend Process

The web application uses server-only runtime values:

| Variable | Purpose |
|----------|---------|
| `INTERNAL_API_ORIGIN` | private origin used by SSR and the Vite `/api` proxy |
| `WEB_URL` | canonical web origin used by Better Auth on the server |
| `TENANT_BASE_DOMAIN` | tenant hostname suffix |
| `PLATFORM_HOST` | platform administration hostname |
| `TRUSTED_PROXY` | set to `1` only behind a trusted proxy that owns forwarded headers |
| `PORT`, `HOST` | production Node server bind values |

Browser code uses same-origin `/api/v1` and `/api/auth`; it does not need a
public `VITE_API_BASE_URL`. `VITE_CSP_NONCE` is the only optional browser-build
value currently referenced by application source.

## Local Services

`meta/docker-compose.yml` provides PostgreSQL and MinIO. Default local values
are embedded in `pnpm start:workspace` for convenience, while secrets still
come from Infisical.

```bash
docker compose -f meta/docker-compose.yml up -d --wait postgres minio
docker compose -f meta/docker-compose.yml up minio-init
```

## Tenancy

- local platform: `localhost:3000`
- local tenant: `<slug>.localhost:3000`
- hosted platform: `PLATFORM_HOST`
- hosted tenants: subdomains of `TENANT_BASE_DOMAIN` or verified tenant domains

The web proxy forwards the original host/protocol to the API. Set
`TRUSTED_PROXY=1` only when the SSR process is actually behind a trusted reverse
proxy; otherwise it uses the direct request host.

## API Documentation

Swagger is mounted at `http://localhost:8080/docs`. It currently covers only
the health group migrated to Effect `HttpApiBuilder`, so inspect router source
and shared contracts for the rest of the API.

## Next Steps

- [Environment Variables](../reference/environment-variables.md)
- [Architecture](../development/architecture.md)
- [Development Setup](../development/setup.md)
