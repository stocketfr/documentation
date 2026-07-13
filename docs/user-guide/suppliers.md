# Suppliers

Suppliers are tenant master data for purchasing contacts. Open **Operations → Suppliers** (`/suppliers`).

## Browse

Search by supplier name and filter active/inactive state. Cards expose edit and delete actions. Active state is changed by editing the record; there is no card-level quick toggle.

## Create or edit

Name is required. Contact person, email, phone, address, HTTP(S) website, notes, and active state are optional.

The current application does not expose supplier-product linking, primary supplier selection, supplier SKUs, pricing histories, purchase orders, or supplier performance. Do not expect changes here to update a product.

## Delete or deactivate

Delete removes the master-data record after server validation. Deactivate a supplier when you need to retain it for operational context. Products do not currently have a user-operable supplier relationship in this UI.

Viewing needs `SUPPLIERS.READ`; changes need `SUPPLIERS.WRITE`.
