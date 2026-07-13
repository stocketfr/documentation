# Environment Variables

Stocket uses Infisical as the operational source of secrets. The `backend/env.template` and `frontend/env.template` files are reference inventories; they are not intended to become committed `.env` files. `pnpm start` in each application runs through the Infisical CLI.

Never commit credentials. Production values are rendered by the infrastructure repository and must be changed through the corresponding secret-management workflow.

## Backend API

### Core and hosts

| Variable | Required | Default/reference | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | none | PostgreSQL connection URL. |
| `NODE_ENV` | Yes | reference: `development` | API accepts `development`, `staging`, or `production`; the worker also requires it. Test runners set their own test-like context. |
| `PORT` | API: yes | reference: `8080` | API listen port, integer from 1 to 65535. |
| `TENANT_BASE_DOMAIN` | Yes | `stocket.fr` | Parent domain used to resolve tenant hosts. |
| `PLATFORM_HOST` | Yes | `app.stocket.fr` | Host reserved for the platform console. |
| `RESERVED_TENANT_SLUGS` | No | built-in list | Comma-separated slugs that cannot become tenants. |
| `CORS_ORIGIN` | Yes | `http://localhost:3000` | Non-empty comma-separated browser origins. `*` is rejected in production (use explicit origins in staging too); verified tenant origins are also allowed dynamically. |
| `FRONTEND_URL` | Yes | `http://localhost:3000` | One or more comma-separated web origins used by auth and email links. |

In local development, `localhost` is the platform host and tenants use `<slug>.localhost:3000`.

### Authentication and explicit administration scripts

| Variable | Required | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Yes | Better Auth signing secret. Use a strong managed value outside tests. |
| `BETTER_AUTH_URL` | Yes | Public backend/auth origin, normally `http://localhost:8080` locally. |
| `BETTER_AUTH_COOKIE_DOMAIN` | No | Explicit shared cookie-domain override; without it, auth derives a shared auth/frontend suffix when possible. |
| `RUN_BETTER_AUTH_MIGRATIONS` | No (production gate) | In production, `true` enables committed SQL, data-marker preparation, Better Auth migration/repair, and pending superadmin data migrations. Non-production runs the sequence automatically; hostname cleanup is development-only. |
| `SUPERADMIN_EMAIL` | Pending migration/seed | Platform administrator email for pending startup data migrations or the explicit seed script. |
| `SUPERADMIN_NAME` | Pending migration/seed | Display name for a newly created account. |
| `SUPERADMIN_PASSWORD` | Pending migration/seed | Plain password alternative; prefer the hash setting. |
| `SUPERADMIN_PASSWORD_HASH` | Pending migration/seed | Hash printed by `superadmin:hash-password`. |
| `SUPERADMIN_ROTATE_PASSWORD` | No | Lets explicit seed and migration `0000` replace an existing credential password; migration `0001` forces rotation regardless. |
| `SUPERADMIN_ALLOW_TENANT_MEMBER` | No | Must be `true` to deliberately promote an account that already has a tenant membership. |

The superadmin values are consumed when startup data-migration markers `0000_seed_platform_superadmin` or `0001_reconcile_platform_superadmin_password` are still pending; the reconcile migration forces password rotation. They are also consumed by an explicit `src/scripts/seed-superadmin.ts` run. The workspace tenant seed accepts `TENANT_ADMIN_EMAIL`, `TENANT_ADMIN_NAME`, `TENANT_ADMIN_PASSWORD` or `TENANT_ADMIN_PASSWORD_HASH`, and `TENANT_ADMIN_ROTATE_PASSWORD`. Select an existing target with either `TENANT_ADMIN_TENANT_ID` or `TENANT_ADMIN_TENANT_SLUG` (never both); `TENANT_ADMIN_TENANT_HOSTNAME` optionally sets its primary hostname. Without a target it chooses the only tenant, prompts among several, or creates the default tenant when none exist. It replaces demo data for the selected tenant.

### Database connection tuning

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_SSL` | `false` | Enables PostgreSQL TLS. |
| `DB_SSL_REJECT_UNAUTHORIZED` | `true` | Validates the server certificate when TLS is enabled. |
| `DB_POOL_MAX` | `20` | Positive maximum per connection pool; Better Auth and Drizzle each create a pool. |

### Email and logging

| Variable | Required | Default/reference | Purpose |
| --- | --- | --- | --- |
| `RESEND_API_KEY` | Staging/production | empty | Resend credential. In development/test, mail is logged instead. |
| `EMAIL_FROM` | Staging/production | template reference: `Stocket <no-reply@mail.stocket.fr>` | Explicit sender identity. Development/test fallback is `Stocket <onboarding@resend.dev>`. |
| `LOG_FORMAT` | No | `text` | `text` or `json`; infrastructure uses `json`. |
| `LOG_LEVEL` | No | runtime default | Effect log threshold. |
| `LOG_SQL` | No | `off` | `off`, `summary`, or `full`. Avoid full SQL around sensitive data. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | `http://localhost:4318/v1/traces` | OTLP HTTP trace endpoint. |

### Object storage

All six settings are startup requirements for both API and worker in the current global layer composition, even when the immediate feature does not use photos/imports.

| Variable | Local reference | Purpose |
| --- | --- | --- |
| `S3_ENDPOINT` | `http://localhost:9000` | S3-compatible endpoint. |
| `S3_REGION` | `us-east-1` | Bucket region. |
| `S3_ACCESS_KEY_ID` | `minio` | Access key. |
| `S3_SECRET_ACCESS_KEY` | `minio123` | Secret key. |
| `S3_BUCKET` | `stocket-local` | Existing bucket name. |
| `S3_FORCE_PATH_STYLE` | `true` | Required for local MinIO; normally false for hosted object storage. |

### Smart Import

| Variable | Default | Purpose |
| --- | --- | --- |
| `PRODUCT_IMPORT_LLM_ENABLED` | `true` | Enables the optional AI proposal layer. |
| `OPENAI_API_KEY` | empty | Provider credential. Empty uses deterministic fallback proposals. |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible API base URL. |
| `PRODUCT_IMPORT_LLM_MODEL` | `gpt-5-mini` | Proposal model. |
| `PRODUCT_IMPORT_LLM_TIMEOUT_MS` | `15000` | Positive request timeout in milliseconds. |

### Background task worker

The API enqueues durable tasks in PostgreSQL; `pnpm start:worker` executes them separately. The worker does not use auth, but its current entry graph eagerly imports shared auth configuration. It therefore needs `NODE_ENV`, `TENANT_BASE_DOMAIN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `FRONTEND_URL` in addition to database, storage, and task settings (plus staging/production email requirements). `PLATFORM_HOST` is not a worker requirement. Keep shared values aligned until that import coupling is removed.

| Variable | Default | Constraint |
| --- | ---: | --- |
| `BACKGROUND_TASK_CONCURRENCY` | `4` | 1–32 tasks. |
| `BACKGROUND_TASK_LEASE_MS` | `60000` | Positive lease duration. |
| `BACKGROUND_TASK_HEARTBEAT_MS` | `15000` | Must be shorter than the lease. |
| `BACKGROUND_TASK_POLL_MS` | `1000` | Positive idle poll interval. |
| `BACKGROUND_TASK_RECOVERY_MS` | `30000` | Positive abandoned-task recovery interval. |
| `BACKGROUND_TASK_RETRY_DELAY_MS` | `30000` | Positive retry delay. |
| `BACKGROUND_TASK_PROGRESS_THROTTLE_MS` | `500` | Positive progress-write throttle. |

## Frontend SSR runtime

| Variable | Required | Default/reference | Purpose |
| --- | --- | --- | --- |
| `INTERNAL_API_ORIGIN` | Yes | `http://localhost:8080` | Server-to-server API origin used by SSR and the Vite proxy. Browsers still call same-origin `/api/v1`. |
| `WEB_URL` | Yes | `http://localhost:3000` | Canonical web origin. |
| `TENANT_BASE_DOMAIN` | Yes | `stocket.fr` | Must match the backend host model. |
| `PLATFORM_HOST` | Yes | `app.stocket.fr` | Must match the backend platform host. |
| `TRUSTED_PROXY` | No | empty | Set to `1` only behind a trusted proxy that sets forwarded host/protocol headers. |
| `PORT` | No | `3000` | Production SSR listen port. |
| `HOST` | No | `127.0.0.1` | Production SSR bind address. |
| `VITE_CSP_NONCE` | No | empty | Optional build-time nonce compiled through `import.meta.env` and forwarded into the router. |

There is no `VITE_API_BASE_URL` in the current request path.

## Test-only settings

- Backend integration tests use `TEST_DATABASE_URL` when supplied.
- The optional real-MinIO storage smoke suite runs only with `RUN_MINIO_STORAGE_SMOKE=true` and a reachable service.
- The E2E seed request sends `x-e2e-seed-secret`. Development permits the seed without a configured secret; other non-production environments require a configured matching `E2E_SEED_SECRET`; production always disables the endpoint.
- Backend E2E seeding recognizes `E2E_DATABASE_URL`, `E2E_TENANT_SLUG`, `E2E_TENANT_NAME`, `E2E_TENANT_HOSTNAME`, and `E2E_USER_EMAIL`.
- Frontend tests use `E2E_FRONTEND_ORIGIN` (reference: `http://e2e.localhost:3000`) plus the variables defined by its Playwright setup and CI workflow.

Test credentials and seed-only values must not be reused in deployed environments.
