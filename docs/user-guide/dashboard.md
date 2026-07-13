# Dashboard

The tenant root (`/`) provides an operational summary:

- product, location, inventory, and low-stock counts;
- low-stock products;
- recent stock-movement ledger entries;
- a limited list of active/pending orders;
- a stock-by-location chart.

The dashboard requires `DASHBOARD.READ`. Its cards also depend on the underlying Products, Locations, Inventory, Stock Movements, and Orders APIs. Depending on role permissions and whether Orders is enabled for the tenant, some data can be unavailable. The order card filters the first 10 returned orders to active statuses and displays at most five, so it is not an order total.

Low stock means an inventory quantity is at or below the product's reorder point. The current location chart is derived from the limited low-stock result, so it is not a complete valuation or all-stock report.

Use the module pages for authoritative lists and filters; the dashboard is a quick signal surface.
