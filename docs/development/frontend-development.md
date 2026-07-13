# Frontend Development

The Stocket web application is a server-rendered React application built with TanStack Start. This guide describes the conventions used by the current frontend.

## Stack

- React 19 and TanStack Start/Router
- TanStack Query for server state and SSR hydration
- TanStack Form with Zod validation
- Better Auth for email/password authentication
- StyleX for feature and layout styles
- Tailwind CSS 4 and shadcn/Radix for UI primitives
- i18next for English, German, and French
- Vitest, Testing Library, and Playwright

## Source Map

```text
frontend/
├── public/                         # Manifest, service worker, offline page, icons
├── e2e/                            # Playwright setup, fixtures, and tests
└── src/
    ├── routes/
    │   ├── __root.tsx              # Document shell and global providers
    │   ├── _authed.tsx             # Host, session, and authenticated layout
    │   ├── _authed/                # Tenant application routes
    │   ├── login.tsx               # Public authentication routes
    │   ├── signup.tsx
    │   ├── forgot-password.tsx
    │   ├── reset-password.tsx
    │   └── platform.tsx            # Platform-host console
    ├── components/
    │   ├── ui/                     # Shared shadcn/Radix primitives
    │   ├── products/import-wizard/ # Smart Import review and execution
    │   └── <module>/               # Feature components
    ├── hooks/                       # Feature orchestration and form hooks
    ├── lib/
    │   ├── data/                   # Typed API/query/mutation hooks
    │   ├── router/                 # Context, guards, and search schemas
    │   ├── server/                 # Server functions and request-host handling
    │   └── stylex/                 # Shared StyleX styles and markers
    ├── locales/{en,de,fr}/
    ├── router.tsx                  # QueryClient and Router integration
    └── routeTree.gen.ts            # Generated; never edit by hand
```

The authenticated route group currently contains the dashboard, products and product detail, locations and location detail, inventory, clients, suppliers, orders, stock movements, audit logs, users, roles, and settings. There is no `/stock` or `/categories` route; category management is part of the products page.

## Rendering and Request Architecture

`getRouter()` creates the router and its `QueryClient`. Query state is dehydrated on the server and hydrated in the browser, so route loaders and components share the same cache. Default query behavior includes a 60-second stale time, intent preloading, scroll restoration, and no retry for 4xx responses.

`src/routes/__root.tsx` owns the HTML document and global providers: branding, localization, theme, tooltips, toasts, development tools, and production service-worker registration. In `beforeLoad`, `src/routes/_authed.tsx` branches on the original request host; the tenant branch resolves the current user before rendering the tenant shell, while the platform branch renders the platform home.

The domain API client has two modes:

- In the browser, requests use same-origin `/api/v1` and include credentials.
- During SSR, requests use `INTERNAL_API_ORIGIN` and forward the cookie plus the original host and protocol so the backend can resolve the tenant.

Authentication forms use the Better Auth browser client at `/api/auth`; route authorization comes from the server-fetched `/api/v1/auth/me` payload. `better-auth` is pinned to an exact version and should be upgraded deliberately.

Only trust `x-forwarded-host` and `x-forwarded-proto` when `TRUSTED_PROXY=1` and the SSR process is behind a trusted proxy that sets them. `VITE_CSP_NONCE` is optional and is passed to the router's SSR configuration.

Because the first render runs on the server, do not read `window`, `document`, `navigator`, `localStorage`, or camera APIs at module scope. Use an event handler, `useEffect`, or an explicit `typeof window !== 'undefined'` guard.

## Routing

TanStack Router derives paths from files, including pathless groups. An authenticated route must therefore declare the full generated route ID:

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { Resource } from '@stocket/types/auth'
import { z } from 'zod'
import { getListCategoriesQueryOptions } from '@/lib/data/categories'
import { requireRouteAccess } from '@/lib/router/guards'
import { pageSearchParam, stringSearchParam } from '@/lib/router/search'

const searchSchema = z.object({
  q: stringSearchParam,
  page: pageSearchParam,
})

export const Route = createFileRoute('/_authed/products')({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: ({ context }) => {
    requireRouteAccess(context.currentUser, Resource.PRODUCTS)
  },
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(getListCategoriesQueryOptions())
  },
  component: ProductsPage,
})
```

Keep shareable filters and pagination in validated URL search parameters. Use loaders to warm queries needed for the initial render, then consume the same query options or hooks in the component. `routeTree.gen.ts` is an output of the TanStack Router plugin and must not be edited manually.

### Host, Permission, and Feature Guards

The parent `_authed` route handles platform-host detection and authentication. Child routes add resource and feature checks with `requireRouteAccess`:

```typescript
import { Resource } from '@stocket/types/auth'
import { FeatureKey } from '@stocket/types/features'
import { requireRouteAccess } from '@/lib/router/guards'

beforeLoad: ({ context }) => {
  requireRouteAccess(context.currentUser, Resource.ORDERS, {
    feature: FeatureKey.ORDERS,
  })
}
```

Use the current-user payload already present in route context; do not fetch permissions again in `beforeLoad`. A platform-only standalone route uses `getServerIsPlatformHost()` and redirects tenant hosts.

Inside components, gate write actions independently because read and write permissions differ:

```typescript
import { Permission, Resource } from '@stocket/types/auth'
import { FeatureKey } from '@stocket/types/features'
import { useFeatures } from '@/lib/features'
import { usePermissions } from '@/lib/permissions'

const { can } = usePermissions()
const features = useFeatures()
const canCreate = can(Permission.WRITE, Resource.PRODUCTS)
const canImport = canCreate && features.has(FeatureKey.SMART_IMPORT)
```

Route guards are the frontend navigation boundary; backend endpoints remain the security authority. Hiding navigation or buttons is additional UX protection, not authorization. When adding a page, keep its route guard and sidebar `resource`/`feature` metadata aligned.

## API and Query Conventions

Use `@/` for imports from `src`. Although the TypeScript configuration still resolves `~/`, new code follows the `@/` convention. Import DTOs and enums from their domain entry point, such as `@stocket/types/products` or `@stocket/types/auth`.

Typed API hooks live in `src/lib/data`. Standard resources use `makeCrudHooks`; custom operations use `makeQueryHook`, `makeParamQueryHook`, or `makeMutationHook`. The Axios helpers attach SSR forwarding headers, unwrap response data, accept abort signals for GET requests, and send browser 401 responses to `/login`.

```typescript
import { useListProducts } from '@/lib/data/products'

const products = useListProducts(
  { search: searchText || undefined, page, limit: 20 },
  { query: { enabled: isReady } },
)

if (products.isLoading) return <LoadingState />
if (products.error) return <ErrorState error={products.error} />
if (!products.data?.data.length) return <EmptyState />
```

Query-specific options are nested under `query`. Mutation callbacks are nested under `mutation`, and generated CRUD mutations receive variables shaped as `{ data }`, `{ id, data }`, or `{ id }`:

```typescript
import { useQueryClient } from '@tanstack/react-query'
import {
  getListProductsQueryKey,
  useCreateProduct,
} from '@/lib/data/products'

const queryClient = useQueryClient()
const createProduct = useCreateProduct({
  mutation: {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getListProductsQueryKey(),
      })
    },
  },
})

createProduct.mutate({ data: values })
```

Prefer exported query-option factories in loaders and exported query keys for targeted invalidation. Preserve the `AbortSignal` when adding GET operations.

## Forms and Internationalization

Feature forms use TanStack Form and Zod, usually through a hook in `src/hooks/forms`. Keep DTO conversion and mutation orchestration in the hook or feature layer rather than in base UI components. Server validation remains authoritative; map API errors to a form banner or field errors.

All user-visible strings require matching keys in `src/locales/en`, `de`, and `fr`. Use `useTranslation()` in components and keep stable enum/status values separate from translated labels.

Sanitize API-provided URLs with `sanitizeUrl()` from `@/lib/utils`. Validate user-entered URLs with the shared safe URL schema before storing them.

## Styling and Components

Use the existing styling layers according to their role:

- StyleX (`stylex.create` and `stylex.props`) for feature layouts and local component styles.
- Shared StyleX primitives from `@/lib/stylex` for repeated layout patterns.
- shadcn/Radix components from `@/components/ui` for accessible controls and overlays.
- Tailwind utilities and `cn()` where a shadcn component exposes `className` or a small utility composition is clearer.
- CSS custom properties from `routes/globals.css` for colors, spacing semantics, and theme-aware values.

```typescript
import * as stylex from '@stylexjs/stylex'
import { Button } from '@/components/ui/button'
import { stylexBase } from '@/lib/stylex/base'

const styles = stylex.create({
  actions: {
    alignItems: 'center',
    display: 'flex',
    gap: '0.75rem',
  },
})

<div {...stylex.props(stylexBase.panelColumn, styles.actions)}>
  <Button type="button">{t('common.save')}</Button>
</div>
```

Do not hard-code light-theme colors. The document can use Stocket light, Stocket dark, neutral light, or neutral dark themes, and all themes resolve through CSS variables.

## Background Tasks and Smart Import

Product import is a multipart request that queues a durable backend task. `importProductsCsv` requires an idempotency key, then `waitForTask` polls `/tasks/:id` every second until `SUCCEEDED`, `FAILED`, or `CANCELED`. The browser-side timeout is 30 minutes; retryable network and selected HTTP failures do not immediately abandon the task.

```typescript
import type { TaskResponseDto } from '@stocket/types/tasks'
import { useState } from 'react'
import { useBulkCsvImport } from '@/hooks/products'

const [task, setTask] = useState<TaskResponseDto | null>(null)
const importProducts = useBulkCsvImport(handleResult, handleFailure)

importProducts.mutate({
  file,
  approvedPlan,
  idempotencyKey,
  onTaskUpdate: setTask,
})
```

Keep the task ID and progress visible so a user can check status after a browser timeout. Reuse the same idempotency key when retrying the same submission. Do not start parallel polling loops; each poll depends on the preceding task state. Smart Import UI must remain gated by both `PRODUCTS.WRITE` and `FeatureKey.SMART_IMPORT`.

## PWA Boundaries

The production root registers `public/sw.js`; development does not. The manifest starts the installed application at `/login?source=pwa`. The service worker precaches the offline page and brand assets, uses network-first navigation with an offline fallback, and uses stale-while-revalidate for static assets.

API requests are explicitly excluded from service-worker caching. The application does not provide offline data, queued mutations, or background synchronization. Features must treat API access as online-only and display normal network errors when disconnected.

## Tests and Checks

Unit and component tests are colocated as `src/**/*.test.ts(x)` and run in Vitest's JSDOM environment with Testing Library and the StyleX test plugin. Put pure query, guard, reducer, and task behavior in focused unit tests; test user-visible component behavior with accessible roles and labels.

Playwright specifications live in `e2e/tests`. The setup project creates authenticated storage state for tenant tests; authentication tests use the unauthenticated project. The target origin comes from `E2E_FRONTEND_ORIGIN`.

From `frontend/`, use:

```bash
pnpm type-check
pnpm lint
pnpm format:check
pnpm test:unit
pnpm test:e2e
pnpm validate       # type-check + lint + format:check
```

Run the smallest relevant unit or E2E test while iterating, then run `pnpm validate` before handoff.

## Adding a Feature Page

1. Add the route under `src/routes/_authed` and use its full generated route ID.
2. Define and validate URL search parameters when state should be shareable.
3. Add resource and optional feature checks with `requireRouteAccess`.
4. Prefetch initial server state with exported query options when useful for SSR.
5. Put API operations in `src/lib/data` and orchestration in a feature hook or component.
6. Gate write controls with `usePermissions` and entitlements with `useFeatures`.
7. Add matching sidebar metadata and translations in English, German, and French.
8. Add focused unit/component coverage and the relevant Playwright flow.

## Common Mistakes

- Declaring an authenticated route as `/products` instead of `/_authed/products`.
- Editing `routeTree.gen.ts` manually.
- Adding new `~/` imports instead of the project-standard `@/` alias.
- Passing `{ enabled }` directly instead of `{ query: { enabled } }` to data hooks.
- Passing a DTO directly to a generated mutation instead of `{ data: dto }`.
- Reading browser globals or browser-only environment values during SSR.
- Forwarding proxy headers without the trusted-proxy boundary.
- Hiding a link without enforcing the same permission and feature at the route.
- Assuming the PWA caches API data or that a browser timeout canceled a backend task.
