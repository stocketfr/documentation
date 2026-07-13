# Quick Start

This walkthrough assumes a new local database, so the untargeted seed creates
the default tenant. On an existing database it selects the only tenant or
prompts among several; use that tenant's hostname instead. Tenant users do not
sign in on the platform host.

## 1. Seed and Sign In

```bash
cd backend
pnpm tenant:seed:workspace
```

On a new database, open `http://stocket.localhost:3000`; otherwise replace
`stocket` with the selected tenant slug/hostname. Sign in with:

- email: `tenant-admin@stocket.fr`
- password: `admin1234`

`http://localhost:3000` is the separate platform-superadmin host.

## 2. Review the Dashboard

The dashboard summarizes products, locations, inventory quantity, low-stock
items, and recent activity. Access depends on the user's resolved resource
permissions.

## 3. Create a Product

1. Open **Products**.
2. Choose **Create Product**.
3. Enter a unique SKU and name.
4. Select an existing category or create a category from the product flow.
5. Optionally set unit, barcode, cost, price, reorder point, perishable state,
   notes, and photos.
6. Save the product.

The QR action reads a QR code into the SKU field when the browser supports the
`BarcodeDetector` API and camera access is granted.

## 4. Create a Location and Area

1. Open **Locations** and create a warehouse, supplier, client, or in-transit
   location.
2. Open the location detail page.
3. Add an area such as a room, shelf, or bin; child areas may be nested.

Avoid deleting a parent area while it still has children. Current deletion
removes only the selected row and can leave descendants unreachable until
repaired.

## 5. Add and Adjust Inventory

1. Open **Inventory** and choose **Add Inventory**.
2. Select the product and location, plus an optional area.
3. Enter quantity and optional batch/expiry data.
4. Use **Adjust** later to apply a positive or negative delta.

Inventory adjustments and stock-movement records are currently independent.
Adjusting quantity does not create a movement, and creating a movement does not
change quantity.

## 6. Try a Guided CSV Import (Optional)

Smart Import is available only when the tenant's `smartImport` entitlement is
enabled and a background worker is running.

1. Open **Products** and choose **Import**.
2. Upload a normalized product CSV or supported Sortly export.
3. Review the structured preview and any deterministic/AI suggestions.
4. Resolve category, location/area, duplicate-SKU, and photo decisions.
5. Approve the plan and monitor the durable task.
6. Review created/updated counts and download the issue CSV when offered.

See [Products](../user-guide/products.md) for the full workflow.

## Next Steps

- [Locations and Areas](../user-guide/locations.md)
- [Inventory](../user-guide/inventory.md)
- [Users and Roles](../user-guide/users-roles.md)
- [Configuration](configuration.md)
