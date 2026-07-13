# Code Style

Stocket's repositories share TypeScript contracts but have independent toolchains. Follow the configuration and nearby code in the repository you are changing; do not assume a root-level formatter or lint command covers every project.

## General TypeScript

- Keep strict typing and avoid `any`. Narrow `unknown` at an adapter boundary when external input cannot be typed directly.
- Prefer inferred return types for local functions and explicit public/domain types where they make the contract clearer.
- Use `import type` for type-only dependencies.
- Preserve the published snake_case API DTO fields; use local UI names only inside the frontend boundary.
- Decode external input with the shared schemas instead of casting.
- Keep changes small enough that the owning repository's checks remain the source of truth.

## Shared contracts

Request, query, response, enum, and common schema definitions live in `packages/types` and publish as `@stocketfr/types`. Consumers import through the local alias and a module subpath:

```ts
import { Permission, Resource } from '@stocket/types/auth'
import { CreateProductRequestSchema } from '@stocket/types/products'
```

Change a shared contract in the packages repository first, add a Changeset, publish or use the approved snapshot workflow, then update consumers. Do not copy a schema into backend and frontend to bypass that lifecycle.

## Backend conventions

The backend runs on Node 22 with Effect and Drizzle. A typical module below `src/effect/modules/<name>/` contains `router.ts`, `service.ts`, `repository.ts`, `mappers.ts`, `types.ts`, and a tagged error file. Larger modules also split `write.ts`, queries, validation, state transitions, or orchestration. Match the module's actual needs instead of forcing empty files.

Responsibilities are:

- **router** — route path/method, shared-schema decoding, permission/feature guards, HTTP response;
- **service/workflow** — domain rules and composition;
- **repository** — tenant-scoped persistence through `TenantQuery`/Drizzle;
- **mapper** — database/domain values to published response DTOs;
- **errors** — typed domain/infrastructure failures.

Use `Effect.Service`, tagged errors, and Effect error channels. Do not throw for expected domain conditions. Use the helpers under `platform/effect`, `platform/db`, and `platform/http` instead of recreating decoding, existence, pagination, or PostgreSQL-error mapping.

Tenant routes declare access and decoding together:

```ts
HttpRouter.post(
  '/',
  tenantRouteContext({
    permissions: [[Resource.PRODUCTS, Permission.WRITE]],
    decode: jsonBody(CreateProductRequestSchema),
    session: 'optional',
  }).pipe(
    Effect.flatMap(({ input, userId }) =>
      respondAuditedMutation(
        Effect.flatMap(ProductsService, (service) =>
          service.create(input, userId),
        ),
        {
          action: AuditAction.CREATE,
          entityType: AuditEntityType.PRODUCT,
          entityId: (product) => product.id,
          responseOptions: { status: 201 },
        },
      ),
    ),
  ),
)
```

Use `tenantRoute` for a normal JSON handler and `tenantRouteContext` when the response/audit flow needs the decoded context. Add a feature `guard` beside permissions. Audit logging from `respondAuditedMutation` is best-effort metadata after success, not part of the domain transaction; never use it as transaction orchestration.

Services use `makeServiceTracer` from `platform/observability/service-tracer`. Log structured message keys/properties rather than interpolated secrets or entire DTOs. Database transactions belong in an explicit workflow that passes the transaction-scoped query surface; cross-module composition is valid when an orchestrator owns the use case.

## Frontend conventions

The frontend uses React 19, TanStack Start/Router/Query/Form, StyleX, Tailwind 4, and shadcn/Radix components.

- Import application code with `@/`; do not introduce the obsolete `~/` convention.
- Route files live under `src/routes`; `routeTree.gen.ts` is generated and must not be edited.
- Put API/query hooks under `src/lib/data` and use the shared DTO subpath.
- Enforce route access with `requireRouteAccess(currentUser, Resource, options)` and mirror the server permission/feature requirement.
- Keep filter state in validated URL search parameters when a list route is shareable.
- Use generated query keys/options for invalidation and conditional fetches.
- Use StyleX for feature/layout styles already following that model; use Tailwind/shadcn primitives where the surrounding component does. Avoid rewriting one system into the other incidentally.
- Keep components accessible: labels, keyboard behavior, focus, error text, and loading/empty states are part of the feature.

Do not assume browser-only globals during SSR. Route loaders/server functions should forward the request host, protocol, and cookie through the existing same-origin API adapters.

## Formatting and linting

Backend and frontend use Prettier for formatting and Oxlint for application linting. The packages repository also publishes `@stocketfr/eslint-config`, but its existence does not make ESLint the current application command.

```bash
# backend
pnpm format
pnpm lint
pnpm type-check

# frontend (non-mutating checks)
pnpm format:check
pnpm lint
pnpm type-check
```

Let the repository formatter decide semicolons and wrapping. Do not combine broad formatting rewrites with a functional change.

## Documentation

Keep English and `.fr.md` pages structurally synchronized. Use relative links, fenced code with a language, and warnings for destructive or non-atomic behavior. Update `mkdocs.yml` for every navigable page and run link/navigation checks before a pull request. CI runs `mkdocs build --strict`.
