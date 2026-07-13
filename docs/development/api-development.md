# API Development

The Stocket backend runs on Node.js 22 with Effect, Drizzle ORM, and PostgreSQL. `tsx` runs the development entry points; esbuild produces Node 22 CommonJS bundles for production. Bun is not the backend runtime.

## Runtime and application composition

The entry points stay deliberately small:

- `src/effect/main.ts` validates `NODE_ENV` and `PORT`, builds the application and HTTP layers, then calls `NodeRuntime.runMain()`.
- `src/effect/task-worker.ts` builds the durable-task worker without starting an HTTP server.
- `src/effect/application/layers.ts` owns service and platform layer composition.
- `src/effect/application/startup.ts` owns startup migrations, default-role seeding, and the notification scanner.
- `src/effect/modules/index.ts` mounts module routers under `/api/v1`.
- `src/effect/http/app.ts` combines the routers, Better Auth, health API, Swagger, and middleware.

The API entry point follows this shape:

```typescript
const applicationLayer = makeApplicationLayer({
  nodeEnv,
  runBetterAuthMigrations:
    process.env.RUN_BETTER_AUTH_MIGRATIONS === 'true',
});

const main = Layer.launch(makeHttpServerLayer(port)).pipe(
  Effect.provide(applicationLayer),
  Effect.provide(runtimeLoggingLayer),
);

NodeRuntime.runMain(main);
```

`platformLayer` provides database, Better Auth, and object storage services. Feature services are composed above that layer, followed by module services and cross-module workflows. Add new wiring in `application/layers.ts`, not in the entry point.

## Module anatomy and shared contracts

Module directories are under `src/effect/modules/<module>/`. They do not follow a mandatory file template. A module commonly contains:

```text
router.ts              HTTP boundary
service.ts             use cases and business rules
repository.ts          tenant-scoped persistence
types.ts               internal types
mappers.ts             database-to-response mapping
write.ts               write workflows, when useful
<module>.errors.ts     typed domain and infrastructure errors
*.spec.ts              focused tests
```

Public DTOs, enums, IDs, query schemas, and request schemas belong in `packages/types` and are imported through a domain export:

```typescript
import {
  ClientIdSchema,
  ClientQuerySchema,
  CreateClientSchema,
  UpdateClientSchema,
} from '@stocket/types/clients';
```

Keep route-only structures, such as `{ id: ClientIdSchema }`, beside the router. Keep database rows and workflow-only types inside the backend module. When adding a public file to the shared package, regenerate its barrels:

```bash
pnpm --dir packages/types barrels
```

## Typed errors

Domain errors use the factories in `platform/effect/domain-errors.ts`. Every application error has a unique tag, HTTP status, `messageKey`, and optional typed message arguments.

```typescript
import {
  ConflictError,
  InternalError,
  NotFoundError,
} from '../../platform/effect/domain-errors';

export class ClientNotFound extends NotFoundError('ClientNotFound')<{
  readonly id: string;
}> {}

export class ClientEmailAlreadyExists extends ConflictError(
  'ClientEmailAlreadyExists',
)<{ readonly email: string }> {}

export class ClientsInfrastructureError extends InternalError(
  'ClientsInfrastructureError',
)<{ readonly action: string; readonly cause?: unknown }> {}
```

Available factories map to `400`, `401`, `403`, `404`, `409`, `500`, and `501`. Schema parse failures become `400`; unknown failures become `500` and are masked in production. Standard response helpers localize messages from the English, French, and German catalogs.

## Tenant-scoped repositories and transactions

Tenant-owned data must derive its tenant from request context, never from a client-supplied `tenant_id`. Prefer `makeTenantCrud()` for conventional CRUD. It uses `TenantQuery` to stamp inserts and scope reads, updates, and deletes.

```typescript
export class ClientsRepository extends Effect.Service<ClientsRepository>()(
  '@stocket/effect/clients/ClientsRepository',
  {
    effect: makeTenantCrud(clients, {
      entity: 'client',
      onError: (action, cause) =>
        new ClientsInfrastructureError({
          action,
          cause,
          messageKey: 'clients.repositoryFailed',
        }),
      list: {
        filters: buildClientFilters,
        orderBy: sql`"company_name" ASC`,
      },
    }),
    dependencies: [TenantQuery.Default],
  },
) {}
```

For bespoke queries, use the scoped helpers exposed by `makeTenantCrud()` (`scopedWhere`, `scopedWhereId`, `scopedWhereIds`, `insertValues`) or `TenantQuery` directly. A cross-tenant ID must behave like a missing ID.

Use the provided `withTransaction` repository helper, or `withDrizzleTransaction`, when several database writes form one invariant. Keep validation and writes inside the same transaction when concurrency matters; an application preflight check is not a database uniqueness guarantee. Do not hold a database transaction open across S3, email, LLM, or other network calls. Audit writes are also outside the business transaction.

Map promise failures into the module's infrastructure error with `makeTryAsync()` or the error wrapper supplied by `makeTenantCrud()`.

## Services and module boundaries

Services expose use cases, map rows to public DTOs, and trace their operations. HTTP routers must call services rather than repositories.

For normal cross-module collaboration, depend on the other module's service. For a genuinely atomic cross-module workflow, create an explicit orchestrator or coordinating repository and inject narrow `Pick<...>` capabilities. This makes transaction ownership visible without spreading repository imports across routers and unrelated services.

Move a helper into `platform/` only after it is domain-neutral and reused. Keep product, order, inventory, and tenant rules in their owning modules. Do not duplicate another module's validation just to avoid a service dependency.

Layer wiring belongs in `application/layers.ts`; route mounting belongs in `modules/index.ts`.

## HTTP routes

### `tenantRoute` and `tenantRouteContext`

Most tenant API routes use the adapters in `platform/http/tenant-route.ts`:

- `tenantRoute()` authorizes, applies an optional guard, decodes input, resolves the requested session mode, runs the handler, and returns a standard JSON response.
- `tenantRouteContext()` performs the same boundary work but returns the decoded context Effect. Use it when the route needs `respondAuditedMutation()`, a custom status/header, or an empty response.
- `queryParams()`, `pathParams()`, `jsonBody()`, and the combined decoders keep parsing at the boundary.

The boundary order is permissions, custom guard, decoding, then explicit session resolution. A permission check already requires authentication. Set `session: 'required'` or `'optional'` when the handler also needs `session` or `userId`; otherwise it defaults to `'none'`.

```typescript
const ClientPathParams = Schema.Struct({ id: ClientIdSchema });

export const clientsRouter = HttpRouter.empty.pipe(
  HttpRouter.get(
    '/',
    tenantRoute({
      permissions: [[Resource.CLIENTS, Permission.READ]],
      decode: queryParams(ClientQuerySchema),
      handler: ({ input: query }) =>
        Effect.flatMap(ClientsService, (clients) =>
          clients.findAllPaginated(query),
        ),
    }),
  ),
  HttpRouter.post(
    '/',
    tenantRouteContext({
      permissions: [[Resource.CLIENTS, Permission.WRITE]],
      decode: jsonBody(CreateClientSchema),
    }).pipe(
      Effect.flatMap(({ input: dto }) =>
        respondAuditedMutation(
          Effect.flatMap(ClientsService, (clients) => clients.create(dto)),
          {
            action: AuditAction.CREATE,
            entityType: AuditEntityType.CLIENT,
            entityId: (client) => client.id,
            responseOptions: { status: 201 },
          },
        ),
      ),
    ),
  ),
  HttpRouter.prefixAll('/clients'),
);
```

### Authentication, RBAC, and feature guards

Better Auth serves `/api/auth/**`. Tenant routes resolve the verified hostname before repositories use tenant context. Never accept a hostname or tenant ID as authorization by itself: the session must also have a membership in that tenant.

Declare RBAC requirements on the route:

```typescript
tenantRoute({
  permissions: [[Resource.ORDERS, Permission.READ]],
  guard: requireOrdersFeature,
  decode: queryParams(OrderQuerySchema),
  handler: ({ input }) =>
    Effect.flatMap(OrdersService, (orders) =>
      orders.findAllPaginated(input),
    ),
});
```

RBAC answers whether the user may perform an action. A feature guard answers whether the tenant's plan or override enables that product capability. They are separate checks. The current feature keys are `orders` and `smartImport`; Smart Import also requires write permissions for products, locations, and inventory.

The exact RBAC resources are:

| Resource | Typical scope |
| --- | --- |
| `DASHBOARD` | Dashboard access |
| `ORDERS` | Orders |
| `CLIENTS` | Clients |
| `SUPPLIERS` | Suppliers |
| `STOCK_MOVEMENTS` | Movement ledger |
| `PRODUCTS` | Product catalog and photos |
| `LOCATIONS` | Locations and areas |
| `INVENTORY` | Inventory records and adjustments |
| `AUDIT_LOGS` | Tenant audit log reads |
| `USERS` | Tenant users |
| `SETTINGS` | Tenant settings and branding |
| `ROLES` | Roles and assignments |

Permissions are `READ` and `WRITE`. There is no `STOCK` resource. Role and assignment writes invalidate the permission cache; feature writes invalidate the entitlement cache.

## Response contracts

Routes return their entity or message body directly. There is no HATEOAS layer and `_links` are not a response guarantee. Status codes and delete bodies are route-specific; do not assume every delete returns `204`.

Standard paginated responses have a nested `meta` object:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "total_pages": 0,
    "has_next": false,
    "has_previous": false
  }
}
```

Bulk operations use the shared `BulkOperationResult` contract:

```json
{
  "success_count": 2,
  "failure_count": 1,
  "succeeded": ["id-1", "id-2"],
  "failures": [
    { "id": "id-3", "error": "Product not found" }
  ]
}
```

Use `runBulkByIds()` from `platform/effect/run-bulk-by-ids.ts` for ID-based bulk workflows, or the builders from `@stocket/types/common` when the workflow needs custom identifiers.

`respondJson()` and `respondEmpty()` attach `x-request-id`, localize message descriptors, and translate typed failures into the standard error envelope. Better Auth responses, Swagger, typed health responses, and CORS preflight do not all pass through those helpers, so do not promise that header on every possible response.

## Audit logging

Use `respondAuditedMutation()` only for mutations whose tenant audit event is part of the current contract. It emits the response after the mutation succeeds and asks `AuditLogWriter` to write an event in a daemon fiber.

Current tenant-audited routers cover areas, categories, clients, inventory, locations, orders, products, roles, stock movements, and suppliers. This does not imply that every mutation in the system is audited. Users, branding, photos, notification preferences, and tasks are examples outside that coverage; superadmin operations use a separate platform audit log.

Tenant audit rows currently record action, entity type and ID, user ID when available, IP address, and timestamp. `changes` and `user_agent` are currently `null`. The write is best-effort, failure is logged and ignored, and it is not in the business transaction. Do not use this log as a complete change history, a rollback source, or a regulatory guarantee.

## Observability

### Service tracing

Create a tracer once per service and wrap public operations with `span()` or `traced()`:

```typescript
const trace = makeServiceTracer({
  serviceName: 'ClientsService',
  module: 'clients',
  layer: 'service',
});

const findOne = (id: string) =>
  repository.findById(id).pipe(
    trace.span('findOne', { attributes: { id } }),
  );
```

`makeServiceTracer()` adds module, layer, operation, request ID, tenant ID when available, and an outcome classification. Use catalogued trace attributes rather than arbitrary keys.

### Structured and localized logging

`createLogger()` comes from `platform/observability/messages.ts`. Its scope prefixes the message key, and its arguments are limited by `LogProperties` in `platform/catalogs/log-properties.ts`.

```typescript
const logger = createLogger('tasks');

yield* logger.info('settled', {
  taskId,
  taskType,
  workerId,
  status,
});
```

Message catalogs live in `platform/catalogs/en.ts`, `fr.ts`, and `de.ts`. Keep their keys synchronized; English defines the typed `MessageKey` set. Avoid unstructured console logging.

### HTTP middleware

For an incoming request, middleware wraps the app in this order:

1. request logging and request context;
2. security headers;
3. CORS, including verified tenant origins;
4. the 10 MiB request-body limit;
5. tenant context;
6. the router.

The standard request context carries request ID, path, method, IP, locale, and resolved tenant ID.

## Health and API discovery

The public health endpoints are:

| Endpoint | Check | Failure |
| --- | --- | --- |
| `GET /health-check/live` | Process liveness only | No dependency check |
| `GET /health-check/ready` | PostgreSQL connectivity | `503` when the database is down |
| `GET /health-check` | PostgreSQL and Better Auth secret | `503` when either is down |

A successful health response uses `status`, `info`, `error`, and `details`:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "better-auth": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up" },
    "better-auth": { "status": "up" }
  }
}
```

The Swagger UI is mounted at `/docs`, but it currently describes only the health group implemented with `HttpApiBuilder`. Most `/api/v1` modules still use `HttpRouter` and do not appear in that OpenAPI document. Treat Swagger as partial until those modules migrate.

## Durable tasks and the worker

Long-running or retryable work must be enqueued as a durable task instead of remaining in the request fiber. The API and worker are separate processes:

```bash
pnpm --filter @stocket/api start
pnpm --filter @stocket/api start:worker
```

Tasks support `queued`, `running`, `succeeded`, `failed`, and `canceled` states, plus progress, retry attempts, leases, heartbeats, delayed retry, recovery, and cooperative cancellation. Task reads and cancellation require a session and are scoped by tenant and creating user:

- `GET /api/v1/tasks`
- `GET /api/v1/tasks/:id`
- `POST /api/v1/tasks/:id/cancel`

Product import is currently the only registered task type. `POST /api/v1/products/import` returns `202` with the task and a `Location: /api/v1/tasks/:id` header. Its `Idempotency-Key` is scoped to tenant, creator, and task type.

To add a task type, define and validate its payload, implement a `TaskHandler`, register it in the worker's `TaskRegistry` layer, add the dependencies to the worker application layer, and expose an enqueueing service. The HTTP process may enqueue tasks; only the worker should execute them.

## Fast verification

For backend API changes, run the smallest relevant checks first:

```bash
pnpm --filter @stocket/api type-check
pnpm --filter @stocket/api lint
pnpm --filter @stocket/api test -- clients
```

Use the affected module name as the Vitest filter. Run integration tests when persistence, transactions, tenancy, or route composition changes.
