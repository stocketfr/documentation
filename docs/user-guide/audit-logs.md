# Audit Logs

Open **Admin → Audit Logs** (`/audit-logs`) to inspect recorded tenant mutations. Access needs `AUDIT_LOGS.READ`; it is not hard-coded to the Admin role, although Admin receives it by default.

## Current table

The table shows action, entity type, a truncated entity ID, user/name when available, and timestamp. The page currently filters by one action and one entity type. It does not expose user, date, or entity-ID filters even though lower-level query support is broader.

The filter contract includes Create, Update, Delete, Restore, Add Photo, Status Change, and Adjust Quantity, plus product/category/supplier/location/area/client/inventory/role/movement/order/item/photo entities. Not every enum combination is emitted: users, branding, photos, notifications, tasks, and superadmin actions are not written to this tenant audit stream; superadmin uses a separate platform audit.

## Current limits

The UI does not show before/after diffs, IP address, user agent, request context, or a detail drawer. Current tenant audit writes set changes and user agent to null.

Audit writes are currently best-effort asynchronous effects, not part of the same database transaction as the domain mutation. A successful business change can therefore exist without a corresponding audit row if that separate insert fails. Use application/database backups and domain records—not this screen alone—for forensic or compliance guarantees.

Deletion behavior varies by module; an audit `Delete` action does not imply every entity is restorable.
