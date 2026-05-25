# Recommended Improvements

This document captures the most useful ideas to borrow from the `t3code` repository after comparing it with the current LibreStock codebase.

The goal is not to copy another stack wholesale. LibreStock already has a coherent architecture:

- `backend/` uses NestJS, TypeORM, Better Auth, and class-validator
- `frontend/` uses TanStack Start, TanStack Router, TanStack Query, and TanStack Form
- `packages/types/` already provides shared TypeScript contracts and some shared Zod schemas

The recommendations below focus on the places where LibreStock can improve safety, maintainability, and boundary design without fighting its current architecture.

## Summary

Highest-value changes:

1. Make shared schemas the source of truth for request and response contracts
2. Validate frontend API responses at the transport boundary
3. Tighten entity id handling beyond plain `string` aliases and casts
4. Add explicit backend configuration validation at startup
5. Improve workflow-level tests for inventory and order behavior

Changes that are **not** recommended right now:

- adopting Effect across the backend
- rewriting the app around event sourcing
- replacing the existing ESLint setup with Oxlint

## What LibreStock Already Does Well

LibreStock already has several strong practices in place:

- shared subpath exports in `packages/types/`
- strict TypeScript in shared config
- a reusable query abstraction layer in the frontend
- documented architecture and repo structure
- explicit backend modules, repositories, services, guards, and interceptors

This means the right strategy is to sharpen existing patterns, not replace them.

## Recommended Changes

### 1. Make Shared Schemas the Single Source of Truth

This is the most important recommendation.

Right now validation rules for some domains are duplicated across multiple places. For products, similar rules exist in:

- `packages/types/src/products/create-product.schema.ts`
- `backend/src/routes/products/dto/create-product.dto.ts`
- `backend/src/routes/products/products.service.ts`
- `frontend/src/hooks/forms/use-product-form.tsx`

That duplication creates drift risk. A field can be accepted on the frontend, rejected in the backend DTO, and then re-checked again in the service.

Recommended direction:

- keep using Zod in `packages/types/`
- expand shared Zod schemas to be the primary contract definition layer
- derive payload validation from those schemas, with thin UI-specific adapters where form state differs from transport shape
- reduce backend DTO duplication by aligning backend request validation with the shared schemas
- preserve or replace current Swagger/OpenAPI metadata intentionally instead of losing it during DTO simplification
- keep backend service rules only for business invariants that depend on database state

Examples of business invariants that should stay in services:

- SKU uniqueness
- category existence
- authorization rules
- state transition rules

Examples of rules that should live in shared schemas:

- trimming
- string length
- UUID shape
- nullable field behavior
- numeric ranges
- payload shape defaults

This is the `t3code` idea that fits LibreStock best: schema-first boundaries, but implemented with Zod rather than Effect.

This should apply to response contracts too, not just request payloads. Shared response schemas are what make frontend response decoding practical.

### 2. Validate Frontend API Responses at the Boundary

The frontend currently trusts generic TypeScript return types from the Axios client:

- `frontend/src/lib/data/axios-client.ts`
- `frontend/src/lib/data/make-crud-hooks.ts`

That gives good editor support, but it does not validate server responses at runtime.

Recommended direction:

- add validated helpers such as `apiGetValidated`, `apiPostValidated`, and similar
- require a Zod schema when reading important backend responses
- decode responses as they enter the client, not later inside components
- normalize transport errors into user-facing or domain-facing error messages in one place

Suggested rollout:

1. start with auth, products, inventory, and orders
2. apply response validation only to read paths first
3. later add request payload validation in shared helpers where useful

This is the REST equivalent of the defensive message decoding that makes `t3code` resilient.

### 3. Tighten Entity Id Types

LibreStock already uses typed entity id aliases in `packages/types/src/common/entity-id.type.ts`, but they are still plain strings plus cast helpers, not true branded types with runtime validation.

Recommended direction:

- define Zod UUID schemas for each entity id type
- parse ids at boundaries such as route params, form payloads, and API clients
- keep typed helpers for ergonomic casting, but prefer parsing over blind casting

This gives two benefits:

- less accidental mixing of ids across entities
- earlier failure when ids are malformed or empty

Today, the real gain here is mostly at the boundary layer. Type aliases and `asXId(...)` helpers are convenient, but they do not stop invalid ids from entering the system.

If this feels too heavy to do for every entity up front, start with:

- `ProductId`
- `CategoryId`
- `LocationId`
- `InventoryId`
- `OrderId`

### 4. Add Backend Config Validation

The frontend already validates environment variables with Zod in `frontend/src/lib/env.ts`.

The backend config is more procedural:

- `backend/src/config/database.config.ts`
- `backend/src/config/db-connection.utils.ts`

Recommended direction:

- add a backend config schema module
- validate all required env vars at startup
- fail fast with explicit errors
- parse booleans, numbers, URLs, and enums in one place

This is a small change with high reliability payoff, especially for deployment and self-hosting.

### 5. Strengthen Query Factories Instead of Replacing Them

LibreStock already has a useful abstraction in `frontend/src/lib/data/make-crud-hooks.ts`. Keep it.

Recommended improvements:

- attach runtime response decoding to query option factories
- standardize query keys by domain
- centralize retry rules for network errors vs validation errors vs auth errors
- centralize error normalization instead of pushing Axios-shaped errors into components

The current structure is already close to the right shape. The improvement is to make the factories own more policy, not to rewrite them.

### 6. Add Better Workflow-Level Integration Tests

LibreStock already has unit and route-level tests, but the highest-risk logic lives in workflows:

- inventory adjustments
- stock movements
- order state changes
- audit log generation
- bulk operations

Recommended direction:

- add integration-style tests that exercise full workflows against a real or test database
- focus on domain invariants and side effects
- prefer a reusable test harness for setup over repeated per-test bootstrapping

Good candidates:

- creating an order updates timestamps and audit data correctly
- stock movement updates inventory in the expected source and destination records
- bulk product operations report partial failures correctly
- deleting or restoring entities preserves expected query behavior

This matters not just as a product quality improvement, but as a safety net for the schema and boundary refactors above.

### 7. Improve Structured Observability Around Business-Critical Flows

LibreStock already has request ids and logging/interceptor infrastructure. That is a good base.

Recommended next step:

- log important domain workflows in a structured way
- include request id, user id, entity ids, and operation outcome
- make audit-sensitive operations easy to trace without depending only on free-form logs

This does not need a full new framework. A small structured logging policy around:

- inventory mutations
- stock movements
- order status changes
- permission-sensitive admin actions

would already be useful.

## Libraries and Tools

### Strong Recommendations

- **Zod**: use it more aggressively as the contract system across the repo
- **TanStack Query/Router/Form**: keep the current stack and build on it

### Optional, Limited Use

- **Oxlint**: only as an additional fast lint pass if ESLint becomes too slow

### Not Recommended for Now

- **Effect** for the backend as a whole

Reason:

- LibreStock is already built around NestJS dependency injection, decorators, exception handling, and TypeORM transactions
- adopting Effect broadly would create overlapping patterns instead of simplifying the architecture
- the main benefit you want from `t3code` is schema-first boundary safety, and Zod already gives you the right foundation for that

If Effect is ever introduced, it should be isolated to a small subsystem, not the main HTTP request pipeline.

## Things Not Worth Copying Directly

Some `t3code` ideas are good there but do not map cleanly to LibreStock:

- full event sourcing for the entire backend
- Effect layers as the main backend composition model
- transport patterns built for agent streams and long-running sessions
- workerized diff rendering and terminal infrastructure

LibreStock is a business CRUD and workflow system, not an agent runtime. The architectural shape should stay different.

## Recommended Adoption Order

### Phase 1

- add backend config validation
- add validated frontend response helpers
- adopt response decoding for auth, products, inventory, and orders

### Phase 2

- remove duplicated validation in one vertical slice, starting with products
- make shared Zod schemas the main contract source for that slice
- keep only database-backed invariants in backend services
- add workflow-level integration coverage for the slice before expanding the pattern further

### Phase 3

- tighten entity id parsing
- improve query factory policy and error normalization
- expand workflow-level integration tests across more domains

### Phase 4

- add structured business-event logging where it matters most

## Final Recommendation

If LibreStock adopts only one major lesson from `t3code`, it should be this:

**make boundaries explicit, validated, and single-sourced**

For LibreStock, that means:

- shared schemas over duplicated DTO definitions
- validated API boundaries over trusted generics
- business invariants in services, shape invariants in schemas
- stronger tests around workflows, not just units

That path gives most of the safety and maintainability benefits without forcing a backend architecture rewrite.
