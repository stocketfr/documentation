# Commandes CLI

Le checkout contient des dépôts indépendants. Exécutez chaque commande depuis le dépôt indiqué. L'espace pnpm généré à la racine facilite le développement local, mais ne définit pas les versions publiées.

## Contrôleur d'espace (`meta`)

```bash
# Cloner/mettre à jour, créer les liens racine, installer et construire les paquets
./scripts/bootstrap

# Démarrer PostgreSQL, MinIO, l'API backend et le frontend
./scripts/dev

# Ajouter le shell desktop ou le watcher de documentation
./scripts/dev --include-desktop
./scripts/dev --include-docs

# Synchroniser uniquement les dépôts
./scripts/clone-or-update
```

L'espace actuel n'accepte que `--include-desktop` et `--include-docs`. PostgreSQL et MinIO sont lancés automatiquement via Docker lorsque celui-ci est disponible ; `--with-docker` est obsolète.

Le processus standard ne lance pas le worker de tâches. Démarrez-le séparément depuis `backend` pour Smart Import.

## Backend (`backend`)

```bash
pnpm start                   # API via Infisical et tsx
pnpm start:worker            # worker de tâches
pnpm start:workspace         # API avec les services locaux
pnpm build                   # bundle API + worker pour Node 22
pnpm start:prod              # API construite
pnpm start:prod:worker       # worker construit
pnpm start:prod:infisical    # API construite via le lanceur Infisical configuré

pnpm type-check
pnpm lint
pnpm lint:fix
pnpm format

pnpm test
pnpm test:watch
pnpm test:cov
pnpm test:integration
pnpm test:mutation:pure
pnpm test:duplicates
```

Données et opérations :

```bash
pnpm drizzle -- <arguments drizzle-kit>
pnpm tenant:seed:workspace
IMPORT_USER_ID=<uuid-utilisateur> pnpm import:products <produits-normalises.csv>
```

`tenant:seed:workspace` remplace les données de démo du tenant sélectionné. Ciblez un tenant existant avec exactement un de `TENANT_ADMIN_TENANT_SLUG=<slug>` ou `TENANT_ADMIN_TENANT_ID=<uuid>` ; `TENANT_ADMIN_TENANT_HOSTNAME` peut remplacer son hôte principal. Sans cible, le script choisit l'unique tenant, demande un choix s'il y en a plusieurs, ou crée le tenant par défaut s'il n'y en a aucun. Vérifiez la cible avant toute exécution hors d'une base locale jetable.

`tenant-admin:seed:workspace` reste un alias de compatibilité ; préférez `tenant:seed:workspace`.

`superadmin:hash-password` lit stdin et imprime le hash Better Auth. Fournissez-le depuis une invite masquée de votre shell ; ne placez jamais le mot de passe littéral dans l'historique. Le seed est une opération explicite séparée, normalement via Infisical :

```bash
infisical run --env=dev -- pnpm exec tsx src/scripts/seed-superadmin.ts
```

Configurez d'abord `SUPERADMIN_*`. Cette invocation CLI est distincte ; le démarrage API appelle la même fonction seulement si sa séquence de migration s'exécute et si `0000`/`0001` sont en attente. En production, la séquence est ignorée sauf avec `RUN_BETTER_AUTH_MIGRATIONS=true`.

L'importeur CLI accepte un seul CSV produit déjà normalisé. `IMPORT_USER_ID` est obligatoire pour l'attribution ; `IMPORT_TENANT_ID`, `IMPORT_TENANT_NAME` et `IMPORT_TENANT_SLUG` peuvent remplacer le contexte tenant. La reconnaissance Sortly et la revue appartiennent au Smart Import web, pas à cette CLI.

## Frontend (`frontend`)

```bash
pnpm dev
pnpm build
pnpm build:infisical         # build via le lanceur Infisical configuré
pnpm start                   # serveur SSR construit

pnpm validate                # type-check + lint + format
pnpm type-check
pnpm lint
pnpm lint:fix
pnpm format:check
pnpm check                   # reformater et corriger le lint

pnpm test:unit
pnpm test:unit:watch
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
```

## Paquets partagés (`packages`)

```bash
pnpm build
pnpm --filter @stocketfr/types barrels
pnpm --filter @stocketfr/types build
pnpm --filter @stocketfr/emails test

pnpm changeset
pnpm version:packages
pnpm publish:prepare
pnpm release
```

Changesets pilote les pull requests de version et GitHub Packages. Une évolution publiable ajoute un changeset ; les pull requests éligibles du même dépôt publient automatiquement des snapshots immuables. `version:packages` modifie versions/changelogs et `release` publie à l'extérieur : ce sont des opérations mainteneur/CI, pas des contrôles locaux ordinaires.

## Desktop distant (`remote-desktop`)

```bash
pnpm dev
pnpm build
pnpm test
pnpm lint
```

La publication Tauri est expérimentale et doit encore être réconciliée avec la sortie SSR du frontend avant d'être considérée comme supportée.

## Documentation (`documentation`)

```bash
node scripts/audit-docs.mjs
mkdocs serve
mkdocs build --strict
```

Utilisez l'environnement virtuel Python 3.12 décrit dans le README du dépôt. Le
shell Nix actuel ne fournit pas `mkdocs-static-i18n` de manière fiable ; il ne
constitue donc pas encore le chemin de vérification reproductible. Les pull
requests exécutent l'audit et la construction stricte. Les merges sur `main`
répètent l'audit puis déploient avec `mkdocs gh-deploy` dans GitHub Actions.

## Infrastructure (`infrastructure`)

L'infrastructure reste volontairement hors de l'espace applicatif généré. Depuis ce dépôt :

```bash
terraform fmt -check -recursive
terraform init
terraform validate
terraform plan

ansible-galaxy collection install -r ansible/requirements.yml
ansible-playbook -i localhost, -c local ansible/site.yml --syntax-check \
  --extra-vars @ansible/syntax-check-vars.yml
```

Les apply/destroy de production exigent des identifiants protégés et une revue. Suivez le runbook du dépôt et sa protection contre la destruction.

## Authentification GitHub Packages

L'installation des paquets exige un token GitHub avec `read:packages` dans la configuration npm utilisateur :

```ini
@stocketfr:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Ne placez jamais le token dans un fichier du dépôt ni dans l'historique du shell.
