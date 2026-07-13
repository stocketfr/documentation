# Users and Roles

Open **Admin → Users** (`/users`) and **Admin → Roles** (`/roles`). Access is controlled separately by `USERS` and `ROLES` read/write permissions.

## Users

Create a user with name, email, and a password of at least eight characters; role assignment is optional. The list has a search field and role filter; the current backend search matches the user's name, not email.

Available actions depend on `USERS.WRITE`:

- edit a user's roles;
- ban or unban immediately;
- revoke all active sessions;
- delete the user.

The current ban action has no reason, expiry, or confirmation step. A ban is global to the Better Auth account across tenant memberships and does not itself revoke existing sessions; use **Revoke sessions** as well when access must end immediately. Role changes invalidate the normal permission cache immediately. A user with no assigned role has no tenant permissions; always assign an intentional role.

## Permission model

Permissions combine a resource with `READ` or `WRITE`. Current resources are Dashboard, Orders, Clients, Suppliers, Stock Movements, Products, Locations, Inventory, Audit Logs, Users, Settings, and Roles. A tenant feature such as Orders or Smart Import can further restrict a permitted route.

## Seeded system roles

| Role | Current grants |
| --- | --- |
| Admin | Dashboard R; Orders, Clients, Suppliers, Stock Movements, Products, Locations, Inventory, Users, Settings, Roles R/W; Audit Logs R. |
| Warehouse Manager | Dashboard R; Stock Movements, Suppliers, Products, Locations, Inventory, Settings R/W. |
| Picker | Dashboard, Orders, Stock Movements, Products, Locations R; Inventory and Settings R/W. |
| Sales | Dashboard R; Orders and Clients R/W; Products and Inventory R; Settings R/W. |

These are the seeded definitions, not immutable templates. System roles can currently be edited, but cannot be deleted.

## Custom roles

Create a role name and choose each resource/action pair. Custom roles can be edited and deleted. Deleting a custom role removes its user assignments rather than being blocked, so review affected users first and give them a replacement role.

## Safe administration

Keep at least one working Admin account. Test a custom role with a non-critical user before broad assignment. Revoke sessions after suspected account compromise; role removal alone does not end an already authenticated session, although authorization is reevaluated.
