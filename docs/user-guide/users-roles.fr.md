# Utilisateurs et rôles

Ouvrez **Administration → Utilisateurs** (`/users`) et **Administration → Rôles** (`/roles`). Les permissions `USERS` et `ROLES` contrôlent séparément lecture et écriture.

## Utilisateurs

Créez un utilisateur avec nom, e-mail et mot de passe d'au moins huit caractères ; les rôles sont facultatifs. La liste propose recherche et filtre de rôle ; le backend actuel recherche le nom, pas l'e-mail.

Avec `USERS.WRITE`, vous pouvez :

- modifier les rôles ;
- bannir ou réactiver immédiatement ;
- révoquer toutes les sessions ;
- supprimer l'utilisateur.

Le bannissement actuel n'a ni motif, ni expiration, ni confirmation. Il est global au compte Better Auth dans tous ses tenants et ne révoque pas seul les sessions existantes ; utilisez aussi **Révoquer les sessions** pour couper immédiatement l'accès. Un changement de rôle invalide le cache. Un utilisateur sans rôle n'a aucune permission tenant : attribuez toujours un rôle intentionnel.

## Modèle de permissions

Une permission associe une ressource à `READ` ou `WRITE`. Ressources actuelles : Dashboard, Orders, Clients, Suppliers, Stock Movements, Products, Locations, Inventory, Audit Logs, Users, Settings et Roles. Une fonctionnalité tenant, comme Orders ou Smart Import, peut encore restreindre une route autorisée.

## Rôles système initiaux

| Rôle | Droits actuels |
| --- | --- |
| Admin | Dashboard L ; Orders, Clients, Suppliers, Stock Movements, Products, Locations, Inventory, Users, Settings, Roles L/É ; Audit Logs L. |
| Warehouse Manager | Dashboard L ; Stock Movements, Suppliers, Products, Locations, Inventory, Settings L/É. |
| Picker | Dashboard, Orders, Stock Movements, Products, Locations L ; Inventory et Settings L/É. |
| Sales | Dashboard L ; Orders et Clients L/É ; Products et Inventory L ; Settings L/É. |

Il s'agit des définitions semées, pas de modèles immuables. Les rôles système sont actuellement modifiables mais pas supprimables.

## Rôles personnalisés

Créez un nom puis choisissez chaque paire ressource/action. Un rôle personnalisé peut être modifié ou supprimé. Sa suppression retire ses affectations utilisateur au lieu d'être bloquée : examinez les comptes concernés et attribuez un remplacement d'abord.

## Administration sûre

Conservez au moins un compte Admin opérationnel. Testez un rôle personnalisé avec un compte non critique. Révoquez les sessions après une compromission ; retirer un rôle ne clôt pas la session authentifiée, même si l'autorisation est recalculée.
