# Démarrage

Stocket est une application d'inventaire multi-tenant composée de dépôts
backend, frontend, packages et support indépendants. Le projet `meta` assemble
le checkout local pris en charge.

## Prérequis

- Node.js 22 et pnpm 10.28.0
- Git et Docker Compose
- identifiants GitHub Packages (`read:packages`)
- accès Infisical pour les secrets d'exécution
- Nix est optionnel ; plusieurs dépôts fournissent leur propre flake

## Parcours

1. [Installation](installation.md) — s'authentifier, initialiser et démarrer
2. [Démarrage rapide](quick-start.md) — créer un tenant de démo et parcourir le
   vrai workflow produit, emplacement et inventaire
3. [Configuration](configuration.md) — comprendre les frontières d'exécution et
   trouver la référence complète des variables

Les développeurs peuvent ensuite consulter la
[carte des projets et modules](../development/project-map.md).
