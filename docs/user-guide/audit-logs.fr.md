# Journaux d'audit

Ouvrez **Administration → Journaux d'audit** (`/audit-logs`) pour consulter les mutations tenant enregistrées. `AUDIT_LOGS.READ` est requis ; l'accès n'est pas figé sur le rôle Admin, même si celui-ci le reçoit par défaut.

## Tableau actuel

Le tableau affiche action, type d'entité, ID tronqué, utilisateur/nom si disponible et horodatage. La page filtre actuellement par une action et un type. Elle n'expose pas les filtres utilisateur, date ou ID pourtant disponibles à un niveau inférieur.

Le contrat de filtre comprend Création, Mise à jour, Suppression, Restauration, Ajout de photo, Changement de statut et Ajustement, ainsi que produits/catégories/fournisseurs/emplacements/zones/clients/inventaire/rôles/mouvements/commandes/lignes/photos. Toutes les combinaisons ne sont pas émises : utilisateurs, marque, photos, notifications, tâches et actions superadmin ne vont pas dans cet audit tenant ; superadmin possède un audit plateforme séparé.

## Limites actuelles

L'interface n'affiche ni diff avant/après, IP, agent utilisateur, contexte de requête ou tiroir de détail. Les écritures tenant actuelles fixent changements et agent utilisateur à null.

Les écritures d'audit sont actuellement des effets asynchrones au mieux, pas dans la même transaction que la mutation métier. Une modification réussie peut donc ne pas avoir de ligne d'audit si l'insertion séparée échoue. Pour les garanties forensiques ou de conformité, appuyez-vous aussi sur les sauvegardes et données métier.

Le comportement de suppression varie selon le module ; une action `Delete` ne signifie pas que l'entité est restaurable.
