# Installation

Cette procédure crée un checkout multi-dépôts local et démarre la plateforme,
une application tenant, PostgreSQL et MinIO.

## 1. Configurer GitHub Packages

Créez un token GitHub classique avec `read:packages`. Exportez-le comme
`GITHUB_PACKAGES_TOKEN` via une invite masquée ou un gestionnaire de secrets —
ne saisissez pas le token dans l'historique — puis configurez pnpm :

```bash
# GITHUB_PACKAGES_TOKEN doit déjà être exporté de manière sûre.
pnpm config set --global @stocketfr:registry https://npm.pkg.github.com
pnpm config set --global //npm.pkg.github.com/:_authToken "${GITHUB_PACKAGES_TOKEN}"
unset GITHUB_PACKAGES_TOKEN
```

## 2. Cloner le contrôleur du workspace

Depuis un dossier parent vide :

```bash
git clone https://github.com/stocketfr/meta.git
./meta/scripts/bootstrap
```

`meta/repos.yaml` clone les dépôts gérés à côté de `meta` et le bootstrap lie
la configuration racine locale. Le dépôt infrastructure reste séparé.

## 3. S'authentifier auprès d'Infisical

```bash
infisical login
```

Les fichiers versionnés s'appellent `backend/env.template` et
`frontend/env.template`. Ils documentent les clés sans devenir la source locale
des secrets. Voir [Configuration](configuration.md).

## 4. Démarrer la stack

```bash
./meta/scripts/dev
```

Le script démarre PostgreSQL, MinIO et son bucket local, l'API Effect Node.js et
le processus web TanStack Start. Loggle est utilisé s'il est disponible. Le
flag historique `--with-docker` n'est pas nécessaire et n'a pas d'effet actuel.

!!! warning "Utilisateurs de Loggle"
    Le `meta/.loggle.toml` actuel appelle un script frontend `dev:workspace`
    absent. Jusqu'à sa correction, [lancez les projets séparément](../development/setup.md#lancer-les-projets-separement)
    lorsque Loggle est installé.

Pour les imports asynchrones, lancez le worker séparément :

```bash
cd backend
pnpm start:worker
```

## 5. Créer un tenant local

Après l'application des migrations de développement :

```bash
cd backend
pnpm tenant:seed:workspace
```

Sans cible, cette commande ne crée le tenant par défaut que s'il n'en existe
aucun, choisit l'unique tenant ou demande parmi plusieurs. Elle crée/renouvelle
`tenant-admin@stocket.fr` avec `admin1234` et remplace les données du tenant
choisi. Définissez `TENANT_ADMIN_TENANT_SLUG` ou `TENANT_ADMIN_TENANT_ID` pour
cibler explicitement un tenant existant.

!!! danger "Les données tenant sont remplacées"
    N'exécutez pas ce seed sur un tenant dont les données doivent être conservées.

## 6. Vérifier l'installation

| Vérification | URL |
|--------------|-----|
| Liveness API | `http://localhost:8080/health-check/live` |
| Readiness API | `http://localhost:8080/health-check/ready` |
| Swagger partiel | `http://localhost:8080/docs` |
| Hôte web plateforme | `http://localhost:3000` |
| Tenant par défaut sur base neuve | `http://stocket.localhost:3000` |
| Console MinIO | `http://localhost:9001` |

Swagger ne décrit actuellement que le groupe santé implémenté avec Effect
`HttpApiBuilder`, pas tous les endpoints.

## Shell Nix optionnel

Plusieurs dépôts possèdent leur propre flake :

```bash
cd backend
nix develop
```

Il n'existe pas de flake racine. Consultez la
[configuration de développement](../development/setup.md) pour le démarrage
manuel et le dépannage.
