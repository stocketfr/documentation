# Catégories

Les catégories organisent les produits en hiérarchie. Le frontend actuel n'a pas de route Catégories distincte ; l'arbre est intégré dans **Inventaire → Produits**.

## Naviguer et filtrer

Sélectionnez un dossier pour filtrer les produits. Le résultat inclut les catégories descendantes. Parcourez une branche ou revenez au niveau racine pour tous les produits.

## Créer

Depuis la page Produits, créez une catégorie racine ou une enfant de la catégorie sélectionnée.

- Le **nom** est obligatoire et unique parmi les catégories sœurs.
- La **description** est facultative.
- Le **parent** est facultatif pour une catégorie racine.

Le frontend ne permet actuellement que de lister et créer. Il n'expose ni renommage, ni réaffectation, ni suppression. Choisissez donc un nom et un parent stables.

La suppression existe au niveau API mais n'est pas un flux utilisateur documenté : des produits peuvent la bloquer et la suppression d'un parent pourrait orpheliner ses enfants dans le modèle actuel.

La lecture de l'arbre exige `PRODUCTS.READ`, la création `PRODUCTS.WRITE`.
