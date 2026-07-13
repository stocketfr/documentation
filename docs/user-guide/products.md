# Products

Products are tenant-scoped catalogue records. Open **Inventory → Products** (`/products`) to browse, filter, create, edit, and soft-delete them. Opening a card shows the product detail page.

## Browse and filter

The card grid shows the thumbnail, name, SKU, category, active state, reorder point, and perishable state. Use search and category navigation to narrow the list. Category filtering includes descendants.

The list does not currently expose a deleted-products filter. A single soft delete offers a short **Undo** toast; there is no hard-delete action in the UI. Bulk mode can change status or delete selected rows on the current page. Although a restore bulk action exists, deleted rows cannot currently be selected from this list.

## Create or edit

The current form supports:

- required SKU, name, and category;
- unit and barcode;
- standard cost and standard price;
- reorder point;
- active and perishable flags;
- notes;
- multiple photos.

SKUs are unique within the tenant. Changing a SKU does not break ID-based references. The form accepts JPEG, PNG, WebP, and GIF images up to 10 MiB, validates their content, and lets you delete uploaded photos; request overhead shares the same 10 MiB HTTP body cap.

Some imported/API-created products can display additional metadata on their detail page, such as description or physical attributes. The current web form cannot edit those fields and does not manage a primary supplier or supplier SKU.

The `/products/:id` view combines catalogue fields, status, pricing, reorder/perishable information, notes, and a photo gallery when those values exist.

## QR scanning

The scanner can fill the SKU field from a QR code when the browser provides camera access and native `BarcodeDetector` support. It is not a general-purpose barcode decoder in the current UI.

## Reorder and inventory

The reorder point is compared with inventory quantity to identify low stock. Product creation alone does not create inventory; add rows from [Inventory](inventory.md). Deactivating a product keeps its existing data.

## Smart Import

**Import Products** appears only when the tenant has the `SMART_IMPORT` feature (enabled by default on Growth and Enterprise or by a platform override).

1. Upload a normalized CSV or Sortly export.
2. Optionally add up to 4,000 characters of instructions.
3. Review the structured proposal. The importer can use an AI proposal layer; without a provider key it uses deterministic rules.
4. Resolve categories, locations, areas/bins, duplicate variant SKUs, photos, missing locations, and rows marked for review.
5. Adjust unlocked decisions, resolve blockers, and submit.
6. Keep the separate backend task worker running while the page polls progress.

The review shows confidence, suggestions, blockers, create/existing/default decisions, and photo handling. Processing is a durable PostgreSQL background task with idempotent submission. The result reports created, updated, skipped, error, and photo counts and can provide a row-error CSV.

There is no downloadable CSV template in the current UI. Keep the source CSV and the final result because imports cannot be rolled back as one operation.

## Permissions

Viewing needs `PRODUCTS.READ`; mutations need `PRODUCTS.WRITE`. Smart Import additionally needs `LOCATIONS.WRITE`, `INVENTORY.WRITE`, and the tenant feature. Category creation is embedded in this page and follows the corresponding catalogue authorization.
