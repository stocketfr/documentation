# Platform Administration

The platform console is for Stocket superadministrators, not tenant administrators. It is available at the configured platform host (`http://localhost:3000` locally). `/platform` on a tenant host redirects to the tenant application.

## Tenants

The console lists tenant name, slug, primary hostname, and creation time. You can open a tenant or inspect its controls.

Creating a tenant requires a tenant name and valid unique slug plus the first administrator's name, email, and password. An optional product CSV can be attached to start an import for the new tenant.

## Plans and features

Each tenant has one plan: Free, Base, Growth, or Enterprise. Effective features inherit from the plan and can be manually overridden or returned to the plan default.

- **Orders** is enabled by default.
- **Smart Import** is enabled by default for Growth and Enterprise.

Overrides take precedence until cleared. Changes affect route/sidebar availability as well as server authorization.

## Deleting a tenant

Deletion removes most tenant business records, memberships, domains, and photo metadata and cannot be undone. The current path does not remove the tenant's background-task rows, global Better Auth account, or entire object-storage prefix, so operators must verify and clean residual records/S3 objects separately.

Always confirm the tenant ID, slug, hostname, and backup requirements before deletion.
