# Categories

Categories organize products as a hierarchy. There is no separate Categories route in the current frontend; the category tree is embedded in **Inventory → Products**.

## Navigate and filter

Select a category folder to filter products. The result includes products in descendant categories. Move through the tree to focus on a branch or return to the top level for all products.

## Create

From the Products page, create either a top-level category or a child of the selected category.

- **Name** is required and must be unique among siblings.
- **Description** is optional.
- **Parent** is optional for a root category.

The frontend currently supports listing and creating categories only. It does not expose category rename, reparent, or deletion controls. Use stable names and choose the parent carefully.

Category deletion exists at the API layer but is intentionally not documented as a user workflow: products can block it, and deleting a parent could orphan child categories in the current data model.

Viewing the catalogue tree needs `PRODUCTS.READ`; category creation needs `PRODUCTS.WRITE`.
