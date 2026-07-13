# Stocket Inventory

Stocket est une plateforme d'inventaire multi-tenant destinée aux équipes qui doivent savoir quel stock elles possèdent, où il se trouve et comment il se déplace. Elle réunit les catalogues de produits, les emplacements, l'inventaire, les commandes, les utilisateurs et l'historique d'audit dans une seule application web.

Le système actuel combine un backend Effect et un worker en arrière-plan sous Node.js 22, une application TanStack Start avec React 19, PostgreSQL avec Drizzle ORM, Better Auth et un stockage d'objets compatible S3.

## Liens rapides

<div class="grid cards" markdown>

- :material-rocket-launch: **Démarrage**

    Assemblez le workspace, démarrez les services locaux et créez les données de développement.

    [:octicons-arrow-right-24: Installation](getting-started/installation.md)

- :material-book-open-variant: **Guide utilisateur**

    Découvrez les workflows actuels du produit et les fonctions d'administration.

    [:octicons-arrow-right-24: Guide utilisateur](user-guide/index.md)

- :material-code-braces: **Développement**

    Comprenez l'architecture multi-dépôts et contribuez en toute sécurité.

    [:octicons-arrow-right-24: Développement](development/index.md)

- :material-map: **Feuille de route**

    Comparez le socle livré avec les lacunes connues et les décisions futures.

    [:octicons-arrow-right-24: Feuille de route](roadmap.md)

</div>

## Ce qui est disponible aujourd'hui

### Catalogue et inventaire

- Produits avec SKU, prix, catégories imbriquées, seuils de réapprovisionnement et photos
- Emplacements et zones imbriquées pour les entrepôts, clients, fournisseurs et stocks en transit
- Quantités d'inventaire avec informations de batch, de lot et d'expiration
- Ajustements d'inventaire et registre manuel séparé des mouvements ; aucun ne met l'autre à jour automatiquement
- Fiches clients, fournisseurs et commandes avec transitions de statut de commande validées
- Import de produits via des tâches persistantes en arrière-plan, notamment depuis des entrées compatibles CSV/Sortly et avec un mapping assisté optionnel

### Équipes et administration de la plateforme

- Sessions Better Auth avec connexion et routage par hôte tenant
- Administration des utilisateurs, rôles personnalisés, permissions par ressource et droits liés aux fonctionnalités
- Console plateforme pour le cycle de vie des tenants, l'affectation des offres et les dérogations de fonctionnalités
- Branding par tenant et traductions de l'application en anglais, français et allemand
- Métadonnées d'audit au mieux pour certaines mutations métier tenant

### Expérience quotidienne

- Application web SSR avec des workflows d'inventaire responsives
- Tableau de bord récapitulant produits, emplacements, inventaire, stocks faibles, mouvements et commandes
- Filtres de stock faible et pipeline backend pour les notifications planifiées par e-mail
- Scan QR par caméra lorsque le navigateur le permet
- Manifest PWA installable, cache runtime des ressources statiques récupérées et page de repli hors ligne

!!! important "Ce que signifie le support hors ligne"
    Le support PWA installe l'application, précharge repli/manifeste/icônes et peut mettre en cache les ressources statiques récupérées. Les pages de navigation réussies et les requêtes API ne sont pas mises en cache pour un usage hors ligne. Données, écritures, synchronisation et conflits exigent une connexion.

## Organisation du projet

Stocket n'est pas un dépôt Git unique. Le dépôt `meta` assemble des dépôts séparés pour le backend, le frontend, les packages, le client desktop, la documentation et la landing page dans un workspace local. L'infrastructure est maintenue dans son propre dépôt. Consultez la [carte des projets](development/project-map.md) et le [guide d'architecture](development/architecture.md) pour connaître les responsabilités et les frontières d'exécution.

La CI valide le backend et le frontend actuels, mais ces dépôts ne publient ni ne déploient d'artefacts applicatifs automatiquement après un merge. Un rollout manuel temporaire en juillet 2026 n'a pas créé de CD persistant. La publication des packages, le déploiement de la documentation, l'application de l'infrastructure et le packaging desktop disposent chacun de workflows et contrôles distincts. La [feuille de route](roadmap.md#statut-des-releases-et-du-deploiement) décrit cette frontière.
