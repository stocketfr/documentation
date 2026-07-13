# Stock Movements

Stock Movements (`/stock-movements`) is a manual traceability ledger. It records why a quantity moved between locations, but it is not the current inventory balance.

## Record a movement

The form accepts:

- product and a positive whole quantity;
- reason;
- optional source and destination locations;
- optional unit cost, reference number, and notes.

The UI does not currently expose the order link supported by the underlying DTO.

Reasons are Purchase Receive, Sale, Waste, Damaged, Expired, Count Correction, Return from Client, Return to Supplier, and Internal Transfer.

## Browse

The table shows date, product/SKU, source → destination, quantity, reason, and reference. Filter by one reason, product, or location. Cost, user, notes, order, and a detail view are not displayed, and there is no export/report action in the current page.

## Relationship with inventory

!!! warning
    A movement insert does not adjust inventory. An inventory adjustment does not add a movement.

For a receipt, sale, correction, return, or transfer, update the affected inventory rows explicitly. A transfer normally means decrementing the source and creating/incrementing the destination, then optionally recording one movement. The application does not make those steps atomic, so verify the result.

Viewing needs `STOCK_MOVEMENTS.READ`; recording needs `STOCK_MOVEMENTS.WRITE`.
