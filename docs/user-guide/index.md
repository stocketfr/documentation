# User Guide

Stocket is a host-based, multi-tenant inventory application. Open `https://<tenant>.stocket.fr` for a tenant workspace; platform administrators use the dedicated platform host. In local development those addresses are `http://<slug>.localhost:3000` and `http://localhost:3000`.

## Main navigation

- **Dashboard** — operational counts, low-stock items, movements, orders, and a location chart.
- **Inventory** — Products, Locations, and current Inventory rows.
- **Operations** — Clients, Suppliers, Orders, and the Stock Movements ledger.
- **Admin** — Audit Logs, Users, and Roles when your permissions allow them.
- **Settings** — appearance, language, account actions, and tenant branding.

Most grouped sidebar links follow your permissions and tenant feature entitlements. Settings is always shown, and a no-role fallback can expose Dashboard/Settings links even when the stricter route guard redirects; link visibility is not an authorization guarantee. `Ctrl+B` or `Cmd+B` toggles the sidebar. There is no global command search.

## Suggested setup order

1. A platform administrator creates the tenant and its first administrator.
2. The tenant administrator configures [users and roles](users-roles.md) and [branding/settings](settings.md).
3. Create [categories and products](products.md), then [locations and areas](locations.md).
4. Add [inventory](inventory.md), clients, and suppliers.
5. Use [orders](orders.md) and the [stock-movement ledger](stock-movements.md) as required by your workflow.

## Important model boundary

Inventory and stock movements are separate today. Adding or adjusting an inventory row does not create a movement, and recording a movement does not change inventory. A transfer therefore needs explicit inventory updates at the source and destination, plus an optional ledger entry for traceability.

## Browser and offline behavior

Stocket is installable as a PWA in supported browsers. Its service worker precaches the offline fallback, manifest, and brand icons and can cache fetched static assets. Successful application pages and API data are not stored or synchronized for offline use. Use a network connection for every data operation.

The camera scanner uses the browser's native `BarcodeDetector` and currently accepts QR-code results. Availability depends on the browser, device, permission, and secure context.

## Help by task

- [Authentication and account recovery](authentication.md)
- [Dashboard](dashboard.md)
- [Products and Smart Import](products.md)
- [Locations, areas, and inventory](locations.md)
- [Clients](clients.md) and [suppliers](suppliers.md)
- [Orders](orders.md) and [stock movements](stock-movements.md)
- [Users and roles](users-roles.md), [audit logs](audit-logs.md), and [settings](settings.md)
- [Platform administration](platform-administration.md)
