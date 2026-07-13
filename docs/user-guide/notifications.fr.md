# Notifications

Stocket envoie actuellement les e-mails transactionnels et les alertes de stock faible. Il n'existe pas encore de page Notifications dans le frontend ; les préférences sont disponibles via l'API tenant authentifiée `/api/v1/notifications/preferences`.

## Catégories

| Catégorie | Comportement actuel |
| --- | --- |
| Compte | Vérification, mot de passe et bienvenue. Les messages de compte obligatoires ne peuvent pas être désactivés. |
| Alertes d'inventaire | E-mail de stock faible. Les utilisateurs avec `INVENTORY.READ` sont éligibles sauf désinscription. |
| Cycle des commandes | Catégorie réservée ; l'envoi lors des changements de statut n'est pas implémenté aujourd'hui. |

L'e-mail est le seul canal. Les valeurs par défaut sont actives, mais GET ne renvoie que les lignes de préférence stockées au lieu de matérialiser chaque valeur par défaut.

## Scan de stock faible

Le backend vérifie environ chaque minute. Un produit/emplacement au seuil ou en dessous peut générer un e-mail aux utilisateurs éligibles. L'envoi est dédupliqué une fois par utilisateur, produit et emplacement chaque jour.

En développement/test, le transport console journalise les e-mails. Staging et production exigent Resend. Les hooks de compte sont asynchrones : un échec n'annule pas l'action compte. Le stock faible est envoyé par le scan planifié, pas directement par une mutation d'inventaire.
