# Roadmap

This page separates capabilities implemented in the current repositories from known gaps and ideas that still require a product decision. It is not a release schedule and assigns no delivery dates. Issues and pull requests in the repository that owns a change are the source of truth for active work.

!!! info "Contributing"
    Read the [contribution guidelines](contributing/guidelines.md) before taking on an item. Stocket is a multi-repository project, so implementation and documentation work may require linked pull requests.

## Shipped baseline

### Inventory and business workflows

| Capability | Current scope |
| --- | --- |
| Product catalogue | Products, nested categories, SKUs, prices, reorder points, photos, filtering, and bulk product import |
| Locations and areas | Tenant-scoped locations with nested storage areas and location types for operational stock tracking |
| Inventory | Quantities by product and location, batch/lot and expiry data, low-stock and expiry summaries |
| Stock movements | Manual immutable ledger beside inventory adjustments; the two stores do not update one another automatically |
| Business records | Client, supplier, and order records with validated order-status transitions |
| Smart import | Durable import tasks, progress reporting, CSV/Sortly-compatible input, and optional assisted field mapping |
| Notifications | Persisted notification records and preferences plus a scheduled low-stock email pipeline |

Order status tracking is implemented. A complete fulfillment execution workflow for picking, packing, and shipping is not mounted as a live product module and is listed under known gaps below.

### Identity, tenancy, and administration

| Capability | Current scope |
| --- | --- |
| Authentication | Better Auth sessions, password recovery, and tenant-aware host routing |
| Authorization | Custom roles, resource permissions, route protection, and tenant feature entitlements |
| Platform console | Tenant creation, listing, access, deletion, plan assignment, and per-tenant feature overrides |
| Audit and branding | Best-effort audit metadata for selected mutations, tenant naming/logos, personal theme settings, and locale preferences |
| Languages | English, French, and German application translations |

### Web application and PWA

| Capability | Current scope |
| --- | --- |
| Web client | TanStack Start SSR application with React 19, TanStack Router, and TanStack Query |
| Dashboard | Product, location, inventory, low-stock, movement, and order summaries |
| Scanning | Browser camera QR input with a manual-entry fallback |
| PWA shell | Web manifest, install icons, runtime caching of fetched static assets, and an offline fallback page |
| Quality | Unit tests plus full-stack Playwright coverage against the backend, PostgreSQL, and S3-compatible storage |

!!! warning "PWA shell is not offline data"
    The service worker excludes `/api/` requests from its cache. There is no shipped offline inventory database, mutation queue, conflict resolution, or background data synchronization. The current offline experience is limited to cached static resources and a fallback page.

### Shared engineering and operations foundations

| Capability | Current scope |
| --- | --- |
| Shared packages | Versioned `@stocketfr/types`, `@stocketfr/emails`, TypeScript, and lint packages published through Changesets |
| Local workspace | `meta` bootstrap, a shared pnpm overlay, PostgreSQL, MinIO, and optional Loggle process orchestration |
| Infrastructure code | Terraform and Ansible for Hetzner, Caddy, PostgreSQL, app containers, Cloudflare R2, Datadog, and production destroy protection |
| Recovery | Nightly off-box PostgreSQL backups to a separately owned R2 bucket, retention controls, and restore documentation |
| Continuous integration | Repository-specific validation for backend, frontend, packages, infrastructure, desktop, and documentation |
| Documentation | Bilingual MkDocs site with strict pull-request builds and GitHub Pages publication |

Infrastructure code and runbooks describe an operable topology; their presence does not mean every application revision is automatically published or deployed.

## Known gaps and next decisions

These are concrete boundaries in the current implementation. Their order is not a delivery commitment.

| Area | Current boundary | Outcome still needed |
| --- | --- | --- |
| Offline data and sync | PWA shell and offline fallback only | Define local data storage, offline reads, queued writes, conflict handling, and secure resynchronization |
| Search and reporting | Resource-level filters and dashboard summaries | Broader cross-resource search, reusable filters, report generation, and supported exports |
| Bulk inventory work | Product import exists; inventory changes remain focused workflows | Design reviewed bulk adjustments and transfers with validation, auditability, and clear failure handling |
| Notification experience | Backend preferences and low-stock delivery pipeline exist | Complete user-facing controls, notification history, and delivery-operability workflows |
| Fulfillment | Orders and status transitions exist; fulfillment source is not mounted | Define and ship supported picking, packing, dispatch, and shipment workflows before documenting them as available |
| API description | Typed health endpoints expose generated OpenAPI; product API coverage is incomplete | Migrate remaining routes into the typed API description and publish an accurate contract |
| Application distribution | CI builds/tests; a guarded manual one-off deployed the current `main`, but there is no persistent automatic CD or standalone rollback workflow | Define the supported repeatable distribution path, rollout controls, and rollback ownership |
| Desktop packaging | A Tauri client and separate release workflow exist | Reconcile desktop packaging with the current frontend build and define supported update/version behavior |

## Considered, not committed

The following ideas are not active product promises and have no assigned dates:

- Native mobile applications; there is no current mobile application repository in `meta/repos.yaml` or the assembled checkout
- Direct supplier ordering and external supplier integrations
- Demand forecasting and automated reorder recommendations

An idea should move into tracked work only after its user outcome, owning repository, security and data implications, and acceptance criteria are defined.

## Release and deployment status

| Project | Current behavior after merge |
| --- | --- |
| Backend and frontend | CI validates after merge; the July 2026 production rollout used temporary guarded manual workflows, not persistent automatic CD |
| Packages | Changesets maintains a release pull request; merging that version pull request publishes stable packages and GitHub releases |
| Documentation | A push to `main` publishes the MkDocs site to GitHub Pages |
| Infrastructure | Planning is automatic for pull requests; production apply requires an explicit workflow input and protected environment |
| Remote desktop | A separate tag/dispatch workflow exists, but its repository/build assumptions are stale and the packaging path is currently unverified |
| Landing | Static site ownership is separate from the application release flow |

## Repositories

| Repository | Current responsibility | Link |
| --- | --- | --- |
| `meta` | Multi-repository workspace manifest, bootstrap, and local orchestration | [GitHub](https://github.com/stocketfr/meta) |
| `backend` | Node.js 22 Effect API and persisted background-task worker | [GitHub](https://github.com/stocketfr/backend) |
| `frontend` | TanStack Start SSR web application and PWA shell | [GitHub](https://github.com/stocketfr/frontend) |
| `packages` | Shared contracts, email templates, and TypeScript/lint configuration | [GitHub](https://github.com/stocketfr/packages) |
| `infrastructure` | Terraform, Ansible, production topology, monitoring, and recovery | [GitHub](https://github.com/stocketfr/infrastructure) |
| `remote-desktop` | Tauri 2 desktop client shell and packaging workflow | [GitHub](https://github.com/stocketfr/remote-desktop) |
| `documentation` | English/French MkDocs documentation | [GitHub](https://github.com/stocketfr/documentation) |
| `landing` | Static public marketing site | [GitHub](https://github.com/stocketfr/landing) |

See the [project map](development/project-map.md) for the detailed ownership and dependency model.
