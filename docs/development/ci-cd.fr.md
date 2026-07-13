# CI, releases et déploiement

Les dépôts Stocket sont des unités de livraison indépendantes. Il n'existe pas
de pipeline monorepo unique et tous les artefacts validés ne sont pas
actuellement déployés.

## Inventaire des workflows et releases

| Dépôt | Déclencheur | Jobs ou résultat |
|-------|-------------|------------------|
| `backend` | pull requests et pushes sur `main` | audit des dépendances, Oxlint, TypeScript, tests Vitest, intégration PostgreSQL et build Node 22/esbuild |
| `frontend` | pull requests et pushes sur `main` | audit, Oxlint, Prettier, TypeScript, Vitest, build et Playwright full-stack avec backend épinglé, PostgreSQL et LocalStack S3 |
| rollout backend/frontend (temporaire, juillet 2026) | dispatch manuel explicite | garde `main` courant/CI réussie, images SHA et `stocket-deploy` ; retrait après le rollout unique |
| `packages` | pull requests et pushes sur `main` | build, publication de snapshots de PR, PR de version Changesets et publication stable sur GitHub Packages |
| `documentation` | pull requests | audit EN/FR, navigation et liens relatifs, puis `mkdocs build --strict` |
| `documentation` | pushes sur `main` | répétition de l'audit, puis déploiement MkDocs vers `gh-pages` |
| `infrastructure` | pull requests | tests du destroy guard, Terraform fmt/init/validate/plan, syntaxe Ansible, tests Caddy/déploiement/sauvegarde et validation Compose |
| `infrastructure` | dispatch manuel protégé | apply Terraform optionnel, configuration Ansible et vérification |
| `remote-desktop` | tags/dispatch manuel/dispatch dépôt | release brouillon multi-plateforme prévue ; les noms de dépôts, flags frontend et chemins de sortie sont obsolètes, donc ce chemin n'est pas vérifié |
| `landing` | aucun workflow dans le dépôt | contenu statique déployé indépendamment via les réglages GitHub Pages |

Le `mobile-ci.yml` stocké sous `meta/root/.github/workflows/` est un template
inactif. Aucun dépôt mobile n'est actuellement géré par `meta/repos.yaml`.

## État du déploiement applicatif

Le backend et le frontend ne conservent ni CD automatique persistant après
merge ni workflow autonome de rollback déclenché par l'opérateur. Pour un
rollout de production audité en juillet 2026, chaque dépôt a temporairement
porté un workflow manuel **Deploy Once**. Tant qu'il était présent, ce chemin :

- n'acceptait que le SHA du `main` courant après la réussite de la CI push ;
- construisait et publiait une image GHCR taguée par SHA ;
- appelait le helper infrastructure `stocket-deploy` via un SSH restreint. Le
  helper attend jusqu'à 90 secondes la santé Compose des images
  (`/health-check/live` pour l'API et `/` pour le web) ; pour le backend, il
  exige aussi `/health-check/ready` depuis l'hôte et observe le même worker sans
  redémarrage pendant 10 secondes ;
- vérifiait éventuellement une URL publique après le retour du helper, puis
  tentait de déplacer `:latest` vers l'image SHA.

Ces workflows ont été retirés après le rollout unique ; aucun merge normal ne
les déclenchait. Si un contrôle Compose, readiness backend
ou stabilité du worker géré par le helper échoue après le début du remplacement,
`stocket-deploy` tente de restaurer l'image précédente. Le contrôle public
ultérieur se situe hors de cette frontière. Son échec ou celui de l'alias peut
donc laisser le serveur sur l'image SHA et `:latest` inchangé ; l'image SHA reste
aussi dans GHCR. Cette récupération limitée n'est ni un workflow général de
rollback ni une surface de CD persistante.

Le dépôt infrastructure exploite la topologie hébergée sur un serveur et son
helper de déploiement. Les changements d'image restent contrôlés par
l'opérateur hors d'un rollout ponctuel explicitement audité.

!!! warning "Terminologie hors ligne"
    Le frontend possède un shell PWA installable et une page de repli, et un
    shell Tauri existe. Les données et mutations d'inventaire exigent toujours
    l'API. Ne présentez pas le produit comme offline-first ou synchronisé hors
    ligne.

## CI backend

`backend/.github/workflows/ci.yml` exécute quatre jobs sous Node.js 22 :

1. **lint** — installation figée depuis GitHub Packages, audit production,
   Oxlint et TypeScript ;
2. **test** — suite Vitest unitaire ;
3. **integration-test** — PostgreSQL réel et configuration d'intégration ;
4. **build** — bundle de `main.ts` et `task-worker.ts` avec esbuild.

## CI frontend

`frontend/.github/workflows/ci.yml` exécute :

- lint, format, types, audit, tests unitaires et build depuis le lockfile
  frontend autonome ;
- un gate Playwright full-stack qui checkout un commit backend épinglé, lance
  PostgreSQL et LocalStack S3, construit les applications, crée les tenants E2E,
  vérifie la découverte des tests et publie les diagnostics en cas d'échec.

Lorsqu'un changement frontend dépend d'un backend ou package non publié, ne
mettez à jour les révisions explicites qu'après le test de la stack coordonnée.

## Releases des packages partagés

Les packages sont publiés sur GitHub Packages sous `@stocketfr/*`.

1. Chaque changement publiable inclut un Changeset (`pnpm changeset`).
2. Une PR contenant un Changeset publie des versions immuables sous un tag
   propre à la PR pour les tests consommateur.
3. Les merges sur `main` alimentent la pull request de version Changesets.
4. La fusion de cette PR crée les versions stables et releases GitHub.
5. Le backend/frontend mettent à jour leurs alias npm épinglés.

Le code peut importer `@stocket/types`, mais le package registry est
`@stocketfr/types`. GitHub Actions utilise `GITHUB_TOKEN` ; en local, un token
classique `read:packages` est nécessaire.

## Release de la documentation

L'audit sans dépendance contrôle la couverture exacte de la navigation, les
liens relatifs et la structure parallèle des pages anglaises/françaises. La CI
installe ensuite MkDocs Material, l'i18n statique et les dates de révision
localisées, puis exige un build strict. Un push sur `main` répète l'audit avant
le déploiement avec `mkdocs gh-deploy --force`.

L'anglais est la locale par défaut. Les fichiers français portent `.fr.md` ; le
fallback anglais existe, mais les guides publics doivent rester à parité.

## Apply de l'infrastructure

Le workflow de pull request planifie sans modifier la production. Le job apply
exige un dispatch explicite avec `apply=true` et l'environnement protégé
`production`. Il :

1. applique Terraform avec l'état HCP Terraform ;
2. écrit inventaire et variables Ansible dans des fichiers temporaires ;
3. attend cloud-init ;
4. configure l'hôte avec Ansible ;
5. exécute le playbook de vérification ;
6. supprime les fichiers sensibles temporaires.

Consultez le dépôt infrastructure pour les runbooks sauvegarde, destroy guard,
Datadog, Caddy et reprise. Un apply infrastructure ne publie pas à lui seul une
nouvelle version applicative.

## Attentes pour les pull requests

- conserver les changements dans leur dépôt propriétaire ;
- expliquer les révisions et snapshots inter-dépôts ;
- exécuter les vérifications locales du dépôt ;
- préserver la compatibilité lorsque l'ordre de rollout compte ;
- mettre cette page à jour lors d'un changement de workflow ;
- ne jamais conclure à un déploiement depuis des checks uniquement CI.
