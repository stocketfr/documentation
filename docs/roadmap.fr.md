# Feuille de route

Cette page sépare les capacités implémentées dans les dépôts actuels des lacunes connues et des idées qui nécessitent encore une décision produit. Ce n'est pas un calendrier de release et aucune date de livraison n'est attribuée. Les issues et pull requests du dépôt responsable d'un changement sont les sources de vérité pour le travail actif.

!!! info "Contribuer"
    Lisez les [directives de contribution](contributing/guidelines.md) avant de prendre en charge un élément. Stocket est un projet multi-dépôts ; l'implémentation et la documentation peuvent donc nécessiter des pull requests liées.

## Socle livré

### Inventaire et workflows métier

| Capacité | Périmètre actuel |
| --- | --- |
| Catalogue de produits | Produits, catégories imbriquées, SKU, prix, seuils de réapprovisionnement, photos, filtres et import de produits en masse |
| Emplacements et zones | Emplacements propres au tenant avec zones de stockage imbriquées et types d'emplacement pour le suivi opérationnel du stock |
| Inventaire | Quantités par produit et emplacement, données de batch/lot et d'expiration, synthèses des stocks faibles et expirations |
| Mouvements de stock | Registre manuel immuable à côté des ajustements ; les deux stockages ne se mettent pas à jour automatiquement |
| Fiches métier | Fiches clients, fournisseurs et commandes avec transitions de statut de commande validées |
| Import intelligent | Tâches d'import durables, suivi de progression, entrées compatibles CSV/Sortly et mapping assisté optionnel des champs |
| Notifications | Enregistrements et préférences persistants, ainsi qu'un pipeline planifié d'e-mails de stock faible |

Le suivi du statut des commandes est implémenté. Un workflow complet d'exécution pour le picking, le packing et l'expédition n'est pas monté comme module produit actif et figure dans les lacunes connues ci-dessous.

### Identité, tenants et administration

| Capacité | Périmètre actuel |
| --- | --- |
| Authentification | Sessions Better Auth, récupération de mot de passe et routage par hôte tenant |
| Autorisation | Rôles personnalisés, permissions par ressource, protection des routes et droits de fonctionnalités par tenant |
| Console plateforme | Création, liste, accès et suppression des tenants, affectation des offres et dérogations de fonctionnalités par tenant |
| Audit et branding | Métadonnées d'audit au mieux pour certaines mutations, nom/logos tenant, thèmes personnels et préférences de langue |
| Langues | Traductions de l'application en anglais, français et allemand |

### Application web et PWA

| Capacité | Périmètre actuel |
| --- | --- |
| Client web | Application SSR TanStack Start avec React 19, TanStack Router et TanStack Query |
| Tableau de bord | Synthèses des produits, emplacements, inventaire, stocks faibles, mouvements et commandes |
| Scan | Saisie QR par caméra dans le navigateur avec saisie manuelle de secours |
| Shell PWA | Manifest web, icônes, cache runtime des ressources statiques récupérées et page de repli hors ligne |
| Qualité | Tests unitaires et couverture Playwright full-stack avec le backend, PostgreSQL et un stockage compatible S3 |

!!! warning "Le shell PWA n'est pas un mode données hors ligne"
    Le service worker exclut les requêtes `/api/` de son cache. Aucun inventaire local hors ligne, file de mutations, mécanisme de résolution des conflits ou synchronisation des données en arrière-plan n'est livré. L'expérience hors ligne actuelle se limite aux ressources statiques en cache et à une page de repli.

### Fondations partagées d'ingénierie et d'exploitation

| Capacité | Périmètre actuel |
| --- | --- |
| Packages partagés | Packages versionnés `@stocketfr/types`, `@stocketfr/emails`, TypeScript et lint publiés avec Changesets |
| Workspace local | Bootstrap `meta`, overlay pnpm partagé, PostgreSQL, MinIO et orchestration optionnelle des processus avec Loggle |
| Code d'infrastructure | Terraform et Ansible pour Hetzner, Caddy, PostgreSQL, les conteneurs applicatifs, Cloudflare R2, Datadog et la protection contre la destruction de la production |
| Récupération | Sauvegardes PostgreSQL nocturnes hors serveur vers un bucket R2 séparé, contrôles de rétention et documentation de restauration |
| Intégration continue | Validation propre à chaque dépôt pour le backend, le frontend, les packages, l'infrastructure, le desktop et la documentation |
| Documentation | Site MkDocs bilingue avec builds stricts sur les pull requests et publication GitHub Pages |

Le code d'infrastructure et les runbooks décrivent une topologie exploitable ; leur présence ne signifie pas que chaque révision applicative est automatiquement publiée ou déployée.

## Lacunes connues et prochaines décisions

Ces éléments sont des frontières concrètes de l'implémentation actuelle. Leur ordre ne constitue pas un engagement de livraison.

| Domaine | Frontière actuelle | Résultat encore nécessaire |
| --- | --- | --- |
| Données et synchronisation hors ligne | Shell PWA et page de repli hors ligne uniquement | Définir le stockage local, les lectures hors ligne, la mise en file des écritures, la gestion des conflits et la resynchronisation sécurisée |
| Recherche et reporting | Filtres par ressource et synthèses du tableau de bord | Recherche plus large entre ressources, filtres réutilisables, génération de rapports et exports pris en charge |
| Opérations d'inventaire en masse | L'import de produits existe ; les changements d'inventaire restent des workflows ciblés | Concevoir des ajustements et transferts en masse vérifiables avec validation, auditabilité et gestion claire des échecs |
| Expérience de notification | Les préférences backend et le pipeline de livraison des stocks faibles existent | Compléter les contrôles utilisateur, l'historique des notifications et les workflows d'exploitation de la livraison |
| Fulfillment | Les commandes et transitions de statut existent ; le code de fulfillment n'est pas monté | Définir et livrer des workflows pris en charge de picking, packing, expédition et suivi avant de les documenter comme disponibles |
| Description de l'API | Les endpoints typés de santé exposent un OpenAPI généré ; la couverture de l'API produit est incomplète | Migrer les routes restantes vers la description d'API typée et publier un contrat exact |
| Distribution de l'application | La CI construit/teste ; un chemin manuel soumis à des gardes a déployé ponctuellement le `main` courant, sans CD automatique persistant ni workflow autonome de rollback | Définir le chemin de distribution répétable pris en charge, les contrôles de rollout et la responsabilité du rollback |
| Packaging desktop | Un client Tauri et un workflow de release séparé existent | Réconcilier le packaging desktop avec le build frontend actuel et définir le comportement de mise à jour et de version pris en charge |

## Envisagé, non engagé

Les idées suivantes ne sont pas des promesses produit actives et n'ont aucune date attribuée :

- Applications mobiles natives ; aucun dépôt d'application mobile actuel n'est présent dans `meta/repos.yaml` ni dans le checkout assemblé
- Commande directe auprès des fournisseurs et intégrations fournisseurs externes
- Prévision de la demande et recommandations automatiques de réapprovisionnement

Une idée ne doit devenir un travail suivi qu'après définition de son résultat utilisateur, de son dépôt responsable, de ses implications de sécurité et de données, et de ses critères d'acceptation.

## Statut des releases et du déploiement

| Projet | Comportement actuel après un merge |
| --- | --- |
| Backend et frontend | La CI valide après merge ; le rollout de production de juillet 2026 a utilisé des workflows manuels temporaires soumis à des gardes, pas un CD automatique persistant |
| Packages | Changesets maintient une pull request de release ; le merge de cette pull request de versions publie les packages stables et les releases GitHub |
| Documentation | Un push sur `main` publie le site MkDocs sur GitHub Pages |
| Infrastructure | Le plan est automatique pour les pull requests ; l'application en production nécessite une option explicite du workflow et un environnement protégé |
| Client desktop | Un workflow tag/dispatch séparé existe, mais ses hypothèses dépôt/build sont obsolètes et le packaging reste non vérifié |
| Landing page | La propriété du site statique est séparée du flux de release de l'application |

## Dépôts

| Dépôt | Responsabilité actuelle | Lien |
| --- | --- | --- |
| `meta` | Manifest du workspace multi-dépôts, bootstrap et orchestration locale | [GitHub](https://github.com/stocketfr/meta) |
| `backend` | API Effect sous Node.js 22 et worker persistant de tâches en arrière-plan | [GitHub](https://github.com/stocketfr/backend) |
| `frontend` | Application web SSR TanStack Start et shell PWA | [GitHub](https://github.com/stocketfr/frontend) |
| `packages` | Contrats partagés, modèles d'e-mails et configuration TypeScript/lint | [GitHub](https://github.com/stocketfr/packages) |
| `infrastructure` | Terraform, Ansible, topologie de production, monitoring et récupération | [GitHub](https://github.com/stocketfr/infrastructure) |
| `remote-desktop` | Shell client desktop Tauri 2 et workflow de packaging | [GitHub](https://github.com/stocketfr/remote-desktop) |
| `documentation` | Documentation MkDocs en anglais et français | [GitHub](https://github.com/stocketfr/documentation) |
| `landing` | Site marketing public statique | [GitHub](https://github.com/stocketfr/landing) |

Consultez la [carte des projets](development/project-map.md) pour le modèle détaillé des responsabilités et dépendances.
