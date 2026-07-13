# Stocket Inventory

Stocket is a multi-tenant inventory platform for teams that need to understand what stock they have, where it is, and how it moves. It brings product catalogues, locations, inventory, orders, people, and audit history into one web application.

The current system combines a Node.js 22 Effect backend and background worker, a TanStack Start application with React 19, PostgreSQL with Drizzle ORM, Better Auth, and S3-compatible object storage.

## Quick links

<div class="grid cards" markdown>

- :material-rocket-launch: **Getting started**

    Assemble the workspace, start the local services, and create development data.

    [:octicons-arrow-right-24: Installation](getting-started/installation.md)

- :material-book-open-variant: **User guide**

    Learn the current product workflows and administration features.

    [:octicons-arrow-right-24: User guide](user-guide/index.md)

- :material-code-braces: **Development**

    Understand the multi-repository architecture and contribute safely.

    [:octicons-arrow-right-24: Development](development/index.md)

- :material-map: **Roadmap**

    Compare the shipped baseline with known gaps and future decisions.

    [:octicons-arrow-right-24: Roadmap](roadmap.md)

</div>

## What is available today

### Catalogue and inventory

- Products with SKUs, pricing, nested categories, reorder points, and photos
- Locations and nested areas for warehouses, clients, suppliers, and stock in transit
- Inventory quantities with batch, lot, and expiry information
- Inventory adjustments plus a separate manual movement ledger; neither updates the other automatically
- Client, supplier, and order records with validated order-status transitions
- Product import through persisted background tasks, including CSV/Sortly-compatible input and optional assisted mapping

### Teams and platform administration

- Better Auth sessions with tenant-aware sign-in and host routing
- User administration, custom roles, resource permissions, and feature entitlements
- A platform console for tenant lifecycle, plan assignment, and feature overrides
- Tenant branding and English, French, and German application translations
- Best-effort audit metadata for selected tenant business mutations

### Daily experience

- An SSR web application with responsive inventory workflows
- A dashboard for product, location, inventory, low-stock, movement, and order summaries
- Low-stock filters and a backend pipeline for scheduled email notifications
- Camera-based QR scanning where supported by the browser
- An installable PWA manifest, runtime caching for fetched static assets, and an offline fallback page

!!! important "What offline support means"
    The shipped PWA support installs the web application, precaches the fallback/manifest/brand icons, and can cache fetched static assets. Successful navigation HTML and API requests are not cached for offline use. Inventory data, writes, background synchronization, and conflict resolution require a network connection.

## Project shape

Stocket is not a single Git repository. The `meta` repository assembles separate backend, frontend, package, desktop, documentation, and landing repositories into a local workspace. Infrastructure is maintained in its own repository. See the [project map](development/project-map.md) and [architecture guide](development/architecture.md) for ownership and runtime boundaries.

CI validates the current backend and frontend, but those repositories do not publish or deploy application artifacts automatically after merge. A temporary manual-only July 2026 rollout did not create persistent CD. Package publication, documentation deployment, infrastructure apply, and desktop packaging each have separate workflows and controls. The [roadmap](roadmap.md#release-and-deployment-status) records the current boundary.
