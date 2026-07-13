# Locations

Locations represent warehouses, suppliers, goods in transit, or client sites. Open **Inventory → Locations** (`/locations`).

## Browse

Search and filter the paginated cards by type and active status. Select a card to open its detail page and manage the area's hierarchy.

## Create or edit

| Field | Notes |
| --- | --- |
| Name | Required, up to 200 characters. |
| Type | Warehouse, Supplier, In Transit, or Client. |
| Address | Optional. |
| Contact person | Optional. |
| Phone | Optional. |
| Active | Status/filter metadata. Inactive locations remain selectable in current inventory and movement forms. |

## Delete safely

Deleting a location also deletes its area rows. Inventory references can be moved or deleted first. A stock-movement reference also blocks deletion, but movements are immutable and have no supported update/delete workflow; retain and deactivate that location instead.

The location card does not itself show complete inventory history; use Inventory and Stock Movements with the location filter.

See [Areas](areas.md) for the hierarchy and its current parent-deletion limitation.

Viewing locations/areas needs `LOCATIONS.READ`; changes need `LOCATIONS.WRITE`.
