# Configuration du développement

Ce guide crée le checkout multi-dépôts coordonné utilisé pour développer
Stocket.

## Prérequis

- Git ; `jj` est optionnel et utilisé automatiquement pour les nouveaux clones
  s'il est disponible
- Node.js 22
- pnpm 10.28.0, de préférence via Corepack
- Docker avec le plugin Compose
- un token GitHub classique avec `read:packages`
- un accès Infisical à l'environnement de développement Stocket
- Nix avec flakes, `just` et Loggle sont des outils optionnels

Python 3.12 et MkDocs ne sont nécessaires que pour la documentation. Rust et
les bibliothèques système Tauri ne sont nécessaires que pour le shell desktop.

## Authentification GitHub Packages

Le backend et le frontend installent des packages partagés immuables depuis
GitHub Packages. Même les packages publics nécessitent une authentification npm.
Exportez le token comme `GITHUB_PACKAGES_TOKEN` via une invite masquée ou un
gestionnaire de secrets ; ne saisissez jamais sa valeur dans l'historique.

```bash
# GITHUB_PACKAGES_TOKEN doit déjà être exporté de manière sûre.
pnpm config set --global @stocketfr:registry https://npm.pkg.github.com
pnpm config set --global //npm.pkg.github.com/:_authToken "${GITHUB_PACKAGES_TOKEN}"
unset GITHUB_PACKAGES_TOKEN
```

Ne commitez pas le token. GitHub Actions utilise son `GITHUB_TOKEN` temporaire.

## Cloner et initialiser

Choisissez un dossier parent vide, clonez `meta`, puis laissez son manifeste
assembler le checkout :

```bash
git clone https://github.com/stocketfr/meta.git
./meta/scripts/bootstrap
```

Le bootstrap :

1. lit `meta/repos.yaml` et clone/récupère `packages`, `backend`, `frontend`,
   `remote-desktop`, `documentation` et `landing` à côté de `meta` ;
2. lie la configuration racine depuis `meta/root/` ;
3. installe le workspace pnpm racine et les dépendances locales nécessaires ;
4. construit les projets exposant un script `build` de bootstrap.

Il ne clone pas `infrastructure`, qui doit être cloné séparément. Une entrée
`mobile-app` est réservée dans le template racine, mais aucun dépôt mobile actif
n'existe dans le manifeste.

Relancez le bootstrap après une modification de `repos.yaml`, de la
configuration racine ou de la topologie des dépendances. Utilisez
`./meta/scripts/clone-or-update` pour uniquement récupérer les dépôts.

## Configuration de l'environnement

`backend/env.template` et `frontend/env.template` documentent les clés
consommées. Ce sont des références, pas des sources de secrets. Les scripts
normaux invoquent Infisical :

```bash
infisical login
```

Le projet Infisical doit fournir les clés décrites dans
[Variables d'environnement](../reference/environment-variables.md).

!!! warning "Pas de workflow `.env` versionné"
    Les `justfile` actuels n'ont pas de recette `just env` et le template
    s'appelle `env.template`, pas `.env.template`. N'utilisez pas les anciennes
    commandes qui exportent durablement Infisical dans `.env`.

## Démarrer la stack standard

Depuis le dossier parent :

```bash
./meta/scripts/dev
```

Si Loggle est installé et qu'aucun processus optionnel n'est demandé, le script
utilise `meta/.loggle.toml`. Sinon il lance directement les processus.
PostgreSQL et MinIO sont démarrés via Docker dès que possible, puis l'API et le
frontend.

!!! warning "Graphe Loggle actuel"
    `meta/.loggle.toml` appelle actuellement `@stocket/web dev:workspace`, mais
    le frontend n'a pas ce script. Si Loggle est installé, utilisez
    [Lancer les projets séparément](#lancer-les-projets-separement) jusqu'à
    correction de meta. Le runner direct emploie bien le script frontend `dev`.

| Service | Endpoint local | Rôle |
|---------|----------------|------|
| PostgreSQL | `localhost:5432` | données tenant, auth, inventaire, audit et tâches |
| API S3 MinIO | `http://localhost:9000` | photos et entrées des tâches |
| Console MinIO | `http://localhost:9001` | inspection locale (`minio` / `minio123`) |
| API Effect | `http://localhost:8080` | API, auth, santé et Swagger partiel |
| TanStack Start | `http://localhost:3000` | application sur l'hôte plateforme |

Variantes utiles :

```bash
./meta/scripts/dev --include-docs
./meta/scripts/dev --include-desktop
```

`--with-docker` est une option obsolète sans effet actuel. Le runner direct
tente déjà de démarrer PostgreSQL et MinIO.

### Lancer le worker

Le graphe meta standard ne lance pas encore le worker de tâches. Pour tester
les imports asynchrones, ouvrez un autre terminal :

```bash
cd backend
pnpm start:worker
```

L'API et le worker partagent la configuration base et stockage objet.

## Lancer les projets séparément

```bash
docker compose -f meta/docker-compose.yml up -d --wait postgres minio
docker compose -f meta/docker-compose.yml up minio-init
```

Puis, dans deux terminaux :

```bash
cd backend
pnpm start:workspace
```

```bash
cd frontend
pnpm dev
```

`start:workspace` ajoute des valeurs locales sûres pour la base, les hôtes,
CORS, MinIO et le seed autour des secrets Infisical. Pour un développement
backend isolé, `pnpm start` utilise directement l'environnement Infisical.

## Créer un tenant et des données de démo

Après application des migrations :

```bash
cd backend
pnpm tenant:seed:workspace
```

Sans cible, la recette ne crée le tenant par défaut que s'il n'en existe aucun,
choisit l'unique tenant ou demande un choix s'il y en a plusieurs. Elle
crée/renouvelle `tenant-admin@stocket.fr` avec `admin1234`, crée les rôles et
remplace les données de démo : catégories, fournisseurs, produits, emplacements,
clients, inventaire, commandes, mouvements et audit. Pour cibler explicitement
un tenant existant, définissez `TENANT_ADMIN_TENANT_SLUG` ou
`TENANT_ADMIN_TENANT_ID`.

!!! danger "Destructif dans le tenant sélectionné"
    Le seed efface puis recrée les données de démo du tenant sélectionné. Ne le
    pointez pas vers des données à conserver.

Sur une base neuve, ouvrez `http://stocket.localhost:3000` pour le tenant par
défaut créé. Sinon, utilisez le slug/hôte du tenant choisi. La console plateforme
reste sur `http://localhost:3000` et exige un superadmin.

## Shells Nix optionnels

Le backend, le frontend, les packages, la documentation et l'infrastructure
fournissent leurs propres flakes :

```bash
cd backend
nix develop
```

Il n'existe pas de flake racine canonique pour le checkout assemblé.

## Vérifications courantes

```bash
# Backend
cd backend
pnpm type-check
pnpm lint
pnpm test
pnpm test:integration

# Frontend
cd frontend
pnpm type-check
pnpm lint
pnpm format:check
pnpm test:unit

# Packages partagés
cd packages
pnpm build
```

Consultez les [commandes CLI](../reference/cli-commands.md) et le
[dépannage](../reference/troubleshooting.md) pour les erreurs de registry,
d'hôte, de base ou de stockage.
