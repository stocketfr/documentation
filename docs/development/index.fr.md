# Développement

Stocket se développe dans un checkout coordonné de dépôts indépendants.
Commencez par `meta`, qui clone les projets gérés et assemble le workspace pnpm
local.

## Pour commencer

- [Carte des projets et modules](project-map.md) — propriétaires, modules,
  routes frontend, packages et état des déploiements
- [Architecture](architecture.md) — topologie, tenancy, couches et tâches durables
- [Configuration de développement](setup.md) — bootstrap, services et identifiants
- [Style de code](code-style.md) — TypeScript, Effect, React, Oxlint et formatage
- [Tests](testing.md) — tests unitaires, intégration, full-stack et documentation
- [Développement API](api-development.md) — modules backend et patterns HTTP
- [Développement frontend](frontend-development.md) — TanStack Start, données,
  permissions, routes et styles
- [CI/CD](ci-cd.md) — workflows actuels et frontières de release

## Propriété des changements

| Changement | Dépôt |
|------------|-------|
| API, base, worker, adaptateur auth | `backend` |
| Routes web, UI, serveur SSR, client navigateur | `frontend` |
| DTO/schéma inter-dépôts ou modèle d'e-mail | `packages` |
| Checkout, bootstrap, services locaux | `meta` |
| Terraform, Ansible, opérations de l'hôte | `infrastructure` |
| Shell natif | `remote-desktop` |
| Documentation publique | `documentation` |
| Site marketing | `landing` |

Une fonctionnalité peut nécessiter plusieurs pull requests coordonnées. Les
contrats partagés passent par le workflow snapshot/release stable avant la mise
à jour des versions épinglées par les consommateurs.

## Workflow local courant

```bash
# Depuis le dossier qui contiendra tous les dépôts
git clone https://github.com/stocketfr/meta.git
./meta/scripts/bootstrap

# Démarrer PostgreSQL, MinIO, l'API et le web
./meta/scripts/dev
```

Le script choisit Loggle s'il est installé, sinon son runner direct. Le graphe
Loggle commité appelle actuellement le script frontend `dev:workspace` absent :
utilisez le [lancement séparé](setup.md#lancer-les-projets-separement) jusqu'à
correction. `--include-desktop`/`--include-docs` passent par le runner direct et
ajoutent ces processus. PostgreSQL et MinIO sont tentés automatiquement ;
`--with-docker` n'est pas un mode actuel.

Pour un changement ciblé, utilisez les scripts du dépôt propriétaire :

```bash
cd backend
pnpm type-check
pnpm lint
pnpm test
```

Les filtres racine restent disponibles après bootstrap, par exemple
`pnpm --filter @stocket/api type-check`, mais les commandes locales reflètent
le plus directement la CI de chaque dépôt.

## Changements de contrats inter-dépôts

1. Modifier `packages/<package>` et ajouter un Changeset.
2. Utiliser le snapshot de la PR dans les branches backend/frontend coordonnées.
3. Fusionner le changement et la PR de version Changesets.
4. Mettre à jour la version publiée dans chaque consommateur.
5. Exécuter les vérifications consommateur et le gate Playwright full-stack si
   le contrat ou le comportement API change.

Le package publié s'appelle `@stocketfr/types`. Le code applicatif l'importe
via l'alias `@stocket/types` ; cet alias ne doit pas servir de filtre pnpm.

## Avant une pull request

Exécutez les plus petites vérifications prouvant le changement, puis le lint et
le typecheck du dépôt. Ajoutez une couverture d'intégration ou E2E pour les
comportements traversant la base, HTTP ou le navigateur. Mettez à jour ensemble
les documentations anglaise et française lorsqu'un comportement public change.
