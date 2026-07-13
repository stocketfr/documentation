# Clients

Clients are the customer accounts selected when creating orders. Open **Operations → Clients** (`/clients`).

## Browse

The card list can search company name/email and filter account status. Cards show company, status, yacht, contact, email, phone, and credit limit, with edit, status, and delete actions. There is no separate client detail or order-history page.

## Create or edit

Company name, contact person, and valid email are required. Optional fields are yacht name, phone, billing address, default delivery address, account status, payment terms, credit limit, and notes.

Statuses are Active, Suspended, and Inactive metadata. They do not currently prevent selection in a new order. The order form loads at most the first 100 clients and has no client search, so use deliberate naming and confirm the selected record.

Selecting a client while creating an order does not currently copy the client's delivery address or yacht into the order form; enter those values explicitly.

## Delete

A client cannot be deleted while any order references it, including completed or cancelled orders. Changing the order status does not remove the reference. Prefer Inactive when history must remain.

Viewing needs `CLIENTS.READ`; changes need `CLIENTS.WRITE`.
