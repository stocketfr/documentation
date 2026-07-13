# Inventaire

L'inventaire est la quantité actuelle d'un produit dans un emplacement et éventuellement une zone. Ouvrez **Inventaire → Inventaire** (`/inventory`). Le service refuse normalement une combinaison produit/emplacement/zone dupliquée ; il s'agit d'un contrôle applicatif, pas d'une contrainte d'unicité en base.

## Parcourir et filtrer

Le tableau paginé affiche produit/SKU, emplacement/zone, quantité, lot, expiration/statut et actions. Coût unitaire et date de réception sont disponibles en création/édition, pas comme colonnes. Filtrez par recherche, emplacement, zone, stock faible ou expiration. Les filtres restent dans l'URL.

- **Stock faible** : quantité inférieure ou égale au seuil produit.
- **Expire bientôt** : date au plus tard dans 30 jours ; le filtre inclut aussi les lignes déjà expirées.

## Ajouter ou modifier une ligne

Choisissez produit et emplacement, puis éventuellement la zone. Saisissez une quantité entière non négative et, au besoin, lot, date d'expiration, coût unitaire et date de réception.

La modification peut déplacer la ligne et fixer une quantité absolue. La suppression retire la ligne d'inventaire.

## Ajustement rapide

**Ajuster** applique un delta entier positif ou négatif, sans pouvoir passer sous zéro. Le dialogue actuel ne demande aucun motif.

## L'inventaire n'est pas le registre des mouvements

!!! warning
    Créer, modifier, ajuster ou supprimer l'inventaire ne crée aucun mouvement. Enregistrer un mouvement ne change pas non plus l'inventaire.

Pour un transfert physique, décrémentez la source puis créez ou incrémentez la destination. Ajoutez séparément un mouvement `INTERNAL_TRANSFER` si votre procédure exige une trace. Vérifiez les deux côtés.

La lecture exige `INVENTORY.READ`, les modifications `INVENTORY.WRITE`. Les utilisateurs éligibles peuvent recevoir l'[e-mail de stock faible](notifications.md), dédupliqué quotidiennement, sauf désinscription.
