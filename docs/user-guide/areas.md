# Areas

Areas are nested subdivisions inside one location—for example `Deck 1 → Cold Room → Bin A`. Open a location card and use its area tree.

## Work with the tree

- Expand or collapse branches.
- Create a root area or a child below a selected parent.
- Edit the name, optional code and description, active state, or parent.
- Delete an area after resolving its descendants.

A parent must belong to the same location. The application rejects cycles. Codes are optional labels for physical navigation.

## Parent deletion warning

!!! danger
    Reparent or delete every child before deleting a parent area. The current database relation does not cascade child areas. Deleting only the parent leaves descendants pointing at a missing parent, so they disappear from the root-based tree.

Inventory rows assigned to a deleted area keep their location but their area becomes unassigned. Review Inventory after any area deletion.

The current confirmation text can imply cascading deletion; it does not reflect the database behavior above. Follow this guide until that product issue is fixed.

Area access inherits `LOCATIONS.READ`/`LOCATIONS.WRITE`.
