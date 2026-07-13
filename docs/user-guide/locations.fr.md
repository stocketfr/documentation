# Emplacements

Les emplacements représentent des entrepôts, fournisseurs, biens en transit ou sites clients. Ouvrez **Inventaire → Emplacements** (`/locations`).

## Parcourir

Recherchez et filtrez les cartes paginées par type et état actif. Une carte ouvre le détail et la hiérarchie des zones.

## Créer ou modifier

| Champ | Notes |
| --- | --- |
| Nom | Obligatoire, 200 caractères maximum. |
| Type | Entrepôt, Fournisseur, En transit ou Client. |
| Adresse | Facultative. |
| Contact | Facultatif. |
| Téléphone | Facultatif. |
| Actif | Métadonnée de statut/filtre. Les emplacements inactifs restent sélectionnables dans les formulaires actuels d'inventaire et de mouvement. |

## Supprimer sans perdre la cohérence

Supprimer un emplacement supprime aussi ses zones. Les références d'inventaire peuvent être déplacées ou supprimées. Un mouvement bloque aussi la suppression, mais les mouvements sont immuables sans mise à jour/suppression supportée : conservez et désactivez alors l'emplacement.

La carte n'affiche pas l'historique complet ; utilisez les filtres d'Inventaire et de Mouvements.

Consultez [Zones](areas.md) pour la hiérarchie et la limitation actuelle de suppression des parents.

La lecture des emplacements/zones exige `LOCATIONS.READ`, les changements `LOCATIONS.WRITE`.
