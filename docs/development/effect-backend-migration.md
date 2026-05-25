# Effect Backend Migration Plan

This document captures the plan to pivot LibreStock's backend from NestJS to an Effect-native backend.

This is a repo-specific migration plan derived from the official Effect documentation plus the current backend implementation in:

- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `backend/src/routes/**`

## Goal

Move the backend to an architecture where:

- application logic is expressed as `Effect`
- dependencies are provided via services and layers
- HTTP endpoints are defined with the Effect platform HTTP APIs
- request and response validation happen through schemas at the boundary
- config, logging, and resource lifecycle are managed through Effect primitives

## Official Documentation

These are the main official references that should guide the migration:

- [Running Effects](https://effect.website/docs/getting-started/running-effects/)
- [Using Generators](https://effect.website/docs/getting-started/using-generators/)
- [Services](https://effect.website/docs/requirements-management/services/)
- [Layers](https://effect.website/docs/requirements-management/layers/)
- [Configuration](https://effect.website/docs/configuration/)
- [Schema Getting Started](https://effect.website/docs/schema/getting-started/)
- [Platform Introduction](https://effect.website/docs/platform/introduction/)
- [Resource Management](https://effect.website/docs/resource-management/introduction/)
- [Logging](https://effect.website/docs/observability/logging/)
- [Expected Errors](https://effect.website/docs/error-management/expected-errors/)

These API references are the practical HTTP-server pieces for the target architecture:

- [HttpApiBuilder](https://effect-ts.github.io/effect/platform/HttpApiBuilder.ts.html)
- [HttpLayerRouter](https://effect-ts.github.io/effect/platform/HttpLayerRouter.ts.html)
- [OpenApi](https://effect-ts.github.io/effect/platform/OpenApi.ts.html)
- [NodeHttpServer](https://effect-ts.github.io/effect/platform-node/NodeHttpServer.ts.html)
- [NodeRuntime](https://effect-ts.github.io/effect/platform-node/NodeRuntime.ts.html)

## Current Backend Shape

Today the backend is centered around NestJS:

- bootstrap in `backend/src/main.ts`
- dependency graph in `backend/src/app.module.ts`
- controller and DTO routing in `backend/src/routes/**`
- validation through `class-validator` and `ValidationPipe`
- DI via Nest modules and `@Injectable()`
- HTTP middleware, guards, interceptors, and filters via Nest
- OpenAPI generation via `@nestjs/swagger`

That means a full Effect pivot is not an incremental syntax change. It is a platform migration.

## Target Backend Shape

The target architecture should look like this:

1. `main.ts` only starts the Effect runtime and launches the app layer.
2. Each domain exposes services implemented with `Effect.Service` or `Context.Tag`.
3. Dependencies are wired with `Layer`, not Nest modules.
4. HTTP endpoints are declared with `HttpApi` and implemented with `HttpApiBuilder`.
5. Boundary validation uses `Schema`.
6. OpenAPI is generated from the HTTP API definition.
7. Logging, spans, config, and resource lifecycle are handled by Effect libraries.

## Migration Decisions

These decisions should be locked in before implementation starts:

### 1. Keep NestJS or fully replace it

Recommendation:

- fully replace NestJS for the backend entrypoint and HTTP layer

Reason:

- a half-Nest, half-Effect backend keeps two DI models, two error models, and two routing systems alive at once

### 2. Schema system

Recommendation:

- standardize on `Effect.Schema` for backend boundary schemas if the backend is becoming fully Effect-native

Reason:

- a whole-backend pivot is the point where carrying both `class-validator` and another schema system stops being worth it

Note:

- the frontend can still continue using Zod initially if needed
- shared schema strategy can be revisited after the backend migration pattern is stable

### 3. Database strategy

Recommendation:

- phase 1: keep PostgreSQL and wrap current TypeORM access behind Effect services
- phase 2: decide whether to stay on wrapped TypeORM or migrate to an Effect-oriented SQL stack

Reason:

- replacing Nest, DTOs, routing, validation, and the ORM in one move is too much blast radius

## Proposed Folder Direction

One reasonable backend target layout is:

```text
backend/src/
  main.ts
  app/
    api.ts
    live.ts
  config/
    server-config.ts
  http/
    error-mapper.ts
    middleware.ts
  domains/
    orders/
      orders.api.ts
      orders.service.ts
      orders.repo.ts
      orders.schema.ts
      orders.errors.ts
      orders.live.ts
    products/
    inventory/
    ...
  infrastructure/
    db/
    auth/
    logging/
```

The exact names can change, but the important split is:

- API definition
- domain service
- repository boundary
- schema
- live layer

## Rollout Order

### Phase 0: Foundation

- add `effect`, `@effect/platform`, and `@effect/platform-node`
- pin Effect package versions explicitly (see Version Pinning below)
- choose whether to add Effect SQL packages now or later
- add a minimal `main.ts` proof of concept that runs an Effect runtime
- add config loading through `Config`
- add structured logging through Effect logging
- spike Better Auth adapter: mount `toNodeHandler(auth)` through `HttpMiddleware` or a platform-level adapter to confirm auth works inside the Effect HTTP stack (see Better Auth section below)
- spike OpenAPI generation: use `OpenApi.fromApi` on a test endpoint and verify the output is compatible with what the frontend currently expects from the Nest Swagger setup
- set up a dual-boot `main.ts` that runs both Nest and Effect from the same process on different ports during the transition (this allows per-route migration without a flag day)

Deliverable:

- a bootable Effect app skeleton next to the current backend
- confirmed Better Auth and OpenAPI spikes working

### Phase 1: First Vertical Slice

Recommendation:

- migrate `orders` first

Reason:

- `backend/src/routes/orders/orders.service.ts` already contains multi-step orchestration, validation, domain rules, and side effects

Tasks:

- define order request and response schemas
- define typed domain errors
- wrap repository operations behind an Effect service
- expose an Effect HTTP API for the orders endpoints
- map domain errors to HTTP responses
- generate OpenAPI from the API definition
- write integration tests for each migrated endpoint that assert parity with the existing Nest behavior (status codes, response shapes, error cases)

Deliverable:

- one complete Effect-native slice in production shape
- integration test suite proving parity with the Nest implementation

### Phase 2: Shared Infrastructure

- request id handling
- auth boundary integration
- database access layer
- transaction handling
- error mapping policy
- logging and tracing policy

Deliverable:

- reusable infrastructure layers that other domains can consume

### Phase 3: Remaining Domains

Suggested order:

1. products
2. inventory
3. stock movements
4. locations and areas
5. suppliers and clients
6. roles and users
7. audit logs
8. health and branding

Reason:

- migrate the business-critical workflows before the low-risk utility endpoints

### Phase 4: Remove NestJS

Target: begin within 2 weeks of the last domain migration completing. Without a hard deadline the dual-system state tends to become permanent.

- delete `AppModule`
- remove Nest controllers, DTOs, guards, interceptors, and filters
- remove `class-validator` and Nest Swagger decorators
- remove Nest bootstrap from `backend/src/main.ts`
- remove the dual-boot port setup from `main.ts`

Deliverable:

- backend runs entirely on the Effect runtime
- single-port `main.ts` with no Nest dependencies

## Mapping From Current Nest Concepts

Current Nest concept to target Effect concept:

- `NestFactory` -> `NodeRuntime`
- `@Module` -> `Layer`
- `@Injectable()` service -> `Effect.Service` or `Context.Tag`
- DTO class -> `Schema`
- `ValidationPipe` -> schema decode at the HTTP boundary
- controller method -> `HttpApiBuilder` handler
- exception filter -> centralized error mapping layer
- interceptor -> logging / middleware / spans
- `@nestjs/swagger` decorators -> `OpenApi.fromApi`

## Known Repository-Specific Risks

### Better Auth integration

The current auth setup mounts Better Auth as an Express handler in `backend/src/main.ts` via `toNodeHandler(auth)` on the `/api/auth` path, with a rate-limiting middleware in front of it. The `auth` instance (`backend/src/auth.ts`) also runs its own migrations at bootstrap and has database hooks (e.g., auto-assigning the first admin role on user creation).

This must be resolved in Phase 0, not deferred, because it affects every authenticated route.

Concrete approach:

- `toNodeHandler` returns a standard Node `(req, res) => void` handler. Effect's `@effect/platform-node` can mount raw Node handlers via `HttpMiddleware` or by wrapping the handler in a platform adapter.
- The rate-limit middleware (`createAuthRateLimitMiddleware`) must also be re-expressed — either as an Effect `HttpMiddleware` or as a raw Node middleware mounted before the auth handler.
- The bootstrap migration call (`auth.$context` → `runMigrations()`) should be moved into a resource-managed `Layer` that runs migrations on acquire.
- Session extraction (currently in `backend/src/common/auth/session.ts`) must be adapted to read from the Effect request context instead of Express `req`.

The Phase 0 spike should confirm all four of these work before moving to Phase 1.

### TypeORM transaction setup

The backend currently initializes `typeorm-transactional` during bootstrap.

If TypeORM remains temporarily, transaction boundaries must be re-expressed behind Effect services. Do not leak TypeORM transaction mechanics into handlers directly.

### DTO and Swagger volume

The codebase has a large amount of DTO and Swagger decorator usage. Replacing it is feasible, but it is mechanical and broad. Expect a large deletion phase once the new pattern is proven.

## Testing Strategy

Each phase must produce tests that prove parity with the existing Nest implementation:

- **Integration tests per endpoint:** For every migrated endpoint, write tests that assert the same status codes, response shapes, headers, and error responses as the current Nest version. These tests should hit the running Effect server, not mock the HTTP layer.
- **Shadow testing during dual-boot:** While both Nest and Effect are running (dual-boot period), route a subset of non-mutating requests to both stacks and diff the responses. This catches behavioral divergence that unit tests miss.
- **Phase completion criteria:** A phase is not done until its integration test suite passes in CI. "Deliverable" means tested and green, not just coded.

## Rollback Criteria

Define what would trigger a "stop and reassess" before the team is multiple phases deep:

- **Blocking capability gap:** The Effect HTTP stack cannot handle a capability the backend requires (e.g., streaming responses, Server-Sent Events, multipart uploads) and no workaround exists.
- **Auth integration failure:** The Better Auth adapter spike in Phase 0 cannot be made to work reliably, or session extraction introduces unacceptable latency.
- **Performance regression:** The Effect stack shows >2x latency regression on critical endpoints under comparable load.
- **Ecosystem instability:** Effect releases breaking changes that require significant rework of already-migrated code.

If any of these triggers fire, pause the migration and reassess scope. The dual-boot architecture makes partial rollback straightforward — traffic can be routed back to Nest endpoints at any time.

## Version Pinning

Effect moves fast and has had breaking changes between minor versions. To avoid churn:

- Pin exact versions of `effect`, `@effect/platform`, and `@effect/platform-node` in Phase 0.
- Do not bump Effect versions mid-phase. Version bumps should happen between phases, with a dedicated review of the changelog.
- If a bump introduces breakage, treat it as a rollback trigger (see above).

## Implementation Rules

To keep the migration controlled:

- do not mix Promise-heavy services with Effect-heavy services in the same domain long-term
- run effects only at the application edge
- keep domain errors typed and explicit
- decode incoming payloads at the boundary
- decode important outgoing data before returning it
- hide infrastructure behind services
- migrate one full slice at a time

## First Concrete Step

The first implementation task should be:

1. add the Effect runtime and platform dependencies
2. create a parallel Effect backend bootstrap
3. migrate the `orders` slice end to end
4. prove OpenAPI generation, auth wiring, config loading, and database access on that slice

Only after that should the migration pattern be rolled across the rest of the backend.
