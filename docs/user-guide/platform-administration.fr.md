# Administration plateforme

La console plateforme est réservée aux superadministrateurs Stocket, pas aux administrateurs tenant. Elle est accessible sur l'hôte plateforme configuré (`http://localhost:3000` en local). `/platform` sur un hôte tenant redirige vers l'application tenant.

## Tenants

La console liste le nom, le slug, l'hôte principal et la date de création. Elle permet d'ouvrir le tenant ou ses contrôles.

La création exige un nom et un slug unique valide, puis le nom, l'e-mail et le mot de passe du premier administrateur. Un CSV produit optionnel peut démarrer un import pour le nouveau tenant.

## Plans et fonctionnalités

Chaque tenant a un plan : Free, Base, Growth ou Enterprise. Les fonctionnalités effectives héritent du plan et peuvent être forcées manuellement puis remises à la valeur du plan.

- **Commandes** est activé par défaut.
- **Smart Import** est activé par défaut pour Growth et Enterprise.

Une surcharge reste prioritaire jusqu'à sa suppression. Les changements affectent la navigation et l'autorisation serveur.

## Supprimer un tenant

La suppression efface la plupart des données métier tenant, appartenances, domaines et métadonnées photo, sans retour possible. Elle ne retire pas les lignes de tâches du tenant, le compte Better Auth global ni tout le préfixe objet : l'opérateur doit vérifier et nettoyer séparément les enregistrements/objets S3 résiduels.

Confirmez toujours l'ID, le slug, l'hôte et les besoins de sauvegarde avant suppression.
