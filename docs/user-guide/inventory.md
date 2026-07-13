# Inventory

Inventory is the current quantity of a product at a location and optional area. Open **Inventory → Inventory** (`/inventory`). The service rejects a duplicate product/location/area combination during normal creation; this is an application check, not a database uniqueness constraint.

## Browse and filter

The paginated table shows product/SKU, location/area, quantity, batch, expiry/status, and actions. Cost per unit and received date are available in create/edit, not displayed as table columns. Filter by search, location, area, low stock, or expiring stock. Filters are encoded in the URL so a filtered view can be revisited.

- **Low stock** means quantity is at or below the product reorder point.
- **Expiring** currently means expiry is no later than 30 days from now; it also includes already expired rows.

## Add or edit a row

Choose the product and location, then optionally an area. Enter a non-negative whole quantity and optional batch number, expiry date, cost per unit, and received date.

Editing a row can move it to another location/area and set an absolute quantity. Deleting removes that inventory row.

## Quick adjustment

Use **Adjust** for an integer delta, positive or negative. The resulting quantity cannot fall below zero. The current dialog has no reason field.

## Inventory is not the movement ledger

!!! warning
    Creating, editing, adjusting, or deleting inventory does not create a stock-movement entry. Recording a stock movement also does not change an inventory row.

For a physical transfer, decrement the source and create or increment the destination. Add an `INTERNAL_TRANSFER` movement separately if your audit procedure needs a ledger record. Verify both sides before leaving the workflow.

Viewing needs `INVENTORY.READ`; changes need `INVENTORY.WRITE`. Eligible users can receive the daily-deduplicated [low-stock email](notifications.md) unless they opt out.
