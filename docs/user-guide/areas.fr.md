# Zones

Les zones sont des subdivisions imbriquées d'un emplacement, par exemple `Pont 1 → Chambre froide → Bac A`. Ouvrez une carte d'emplacement puis son arbre.

## Utiliser l'arbre

- Développez ou repliez les branches.
- Créez une zone racine ou une enfant du parent sélectionné.
- Modifiez nom, code/description facultatifs, état actif ou parent.
- Supprimez une zone après avoir traité ses descendants.

Le parent doit appartenir au même emplacement et les cycles sont refusés. Le code est un repère physique facultatif.

## Avertissement sur la suppression d'un parent

!!! danger
    Réaffectez ou supprimez chaque enfant avant son parent. La relation actuelle en base ne propage pas la suppression aux zones enfants. Supprimer uniquement le parent laisse des descendants qui pointent vers un parent absent et disparaissent de l'arbre construit depuis la racine.

Les lignes d'inventaire associées à la zone supprimée conservent l'emplacement mais perdent la zone. Contrôlez l'Inventaire après toute suppression.

Le texte de confirmation actuel peut laisser croire à une cascade ; il ne reflète pas ce comportement. Suivez ce guide jusqu'à correction du produit.

L'accès aux zones hérite de `LOCATIONS.READ`/`LOCATIONS.WRITE`.
