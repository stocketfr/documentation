# Dépannage

Commencez par le processus qui possède la frontière défaillante. Le contrôleur d'espace coordonne les dépôts, mais backend, worker, frontend, PostgreSQL et MinIO conservent leurs propres logs et états de santé.

## Bootstrap n'installe pas `@stocketfr/*`

Les paquets partagés sont hébergés dans GitHub Packages.

1. Créez ou renouvelez un token GitHub avec `read:packages`.
2. Configurez le registre `@stocketfr` et le token dans la configuration npm utilisateur.
3. Relancez `pnpm install` dans le dépôt concerné ou `./meta/scripts/bootstrap`.

Ne placez pas le token dans un `.npmrc` du dépôt.

## Mauvaise version de Node ou du gestionnaire

Le backend et le frontend ciblent Node.js 22 et pnpm 10.28. Les autres dépôts
conservent leurs propres versions ; certains workflows des paquets et du desktop
utilisent encore Node.js 20. Vérifiez le dépôt propriétaire avant de les modifier :

```bash
node --version
pnpm --version
```

Entrez dans le shell Nix du dépôt ou activez Corepack si nécessaire. Bun n'est pas le runtime backend.

## PostgreSQL ou MinIO ne démarre pas

`./meta/scripts/dev` tente de démarrer les deux services lorsque Docker est disponible.

```bash
docker compose -f meta/docker-compose.yml ps
docker compose -f meta/docker-compose.yml logs postgres minio minio-init
```

Vérifiez les ports 5432, 9000 et 9001, puis que l'initialisation du bucket est terminée avant de diagnostiquer les photos/imports.

!!! danger
    `docker compose down -v` supprime les volumes PostgreSQL et les objets locaux. Ne l'utilisez pas comme simple redémarrage.

## L'API ou le worker échoue pendant l'initialisation du stockage

Le layer de stockage global vérifie le bucket au démarrage : un stockage invalide
ou inaccessible empêche normalement l'API et le worker de démarrer. Toutes les
valeurs `S3_*` doivent être présentes, l'endpoint doit être une URL valide et le
bucket doit déjà exister. MinIO local exige normalement
`S3_FORCE_PATH_STYLE=true`. Comparez Infisical à `backend/env.template` ;
modifier un `.env` local ne change pas `pnpm start` sans modification volontaire
du lanceur.

## Loggle signale un script frontend absent

Le `meta/.loggle.toml` actuel invoque `@stocket/web dev:workspace`, mais ce
script n'existe pas dans le dépôt frontend. Lorsque Loggle est installé,
démarrez PostgreSQL et MinIO via `meta/docker-compose.yml`, puis
`pnpm start:workspace` dans `backend` et `pnpm dev` dans `frontend`. Le lanceur
direct de meta utilise déjà le bon script, mais `./meta/scripts/dev` choisit
automatiquement Loggle lorsqu'il est installé et qu'aucun processus optionnel
n'est demandé.

## Une route tenant redirige ou renvoie « tenant introuvable »

- Utilisez `http://localhost:3000` pour la console plateforme.
- Utilisez `http://<slug>.localhost:3000` pour un tenant.
- Vérifiez le slug dans la console plateforme. Créez-y un tenant manquant ; le seed cible des tenants existants et ne crée que le tenant par défaut lorsque la base n'en contient aucun.
- Vérifiez que l'utilisateur connecté est membre du tenant. L'inscription publique ne provisionne pas actuellement cette appartenance.
- Alignez `TENANT_BASE_DOMAIN` et `PLATFORM_HOST` entre frontend et backend.

## Les cookies de connexion échouent via SSR ou proxy

Le navigateur appelle `/api/auth` et `/api/v1` sur la même origine ; le SSR transmet cookie, hôte et protocole à `INTERNAL_API_ORIGIN`.

- Vérifiez que `INTERNAL_API_ORIGIN` atteint le backend depuis le frontend.
- Définissez `TRUSTED_PROXY=1` uniquement derrière un proxy de confiance qui fournit les en-têtes forwarded.
- Vérifiez ensemble `BETTER_AUTH_URL`, `FRONTEND_URL`, CORS et le domaine de cookie éventuel.
- N'ajoutez pas `VITE_API_BASE_URL`, inutilisé dans l'architecture actuelle.

## Smart Import reste en attente

L'API ne fait qu'enregistrer la tâche durable dans PostgreSQL. Lancez le worker séparé :

```bash
cd backend
pnpm start:worker
```

Inspectez ensuite les logs API et worker, `BACKGROUND_TASK_*`, PostgreSQL et S3/MinIO. L'absence de `OPENAI_API_KEY` n'est pas une erreur : l'import utilise alors des propositions déterministes.

## Inventaire et mouvements divergent

Les lignes d'inventaire et le registre des mouvements sont actuellement indépendants. Un mouvement ne modifie pas l'inventaire et un ajustement d'inventaire ne crée pas de mouvement. Corrigez la ligne d'inventaire et ajoutez séparément l'écriture de registre nécessaire.

## Une zone enfant disparaît après suppression du parent

Ne supprimez pas une zone parent tant qu'elle a des enfants. La relation actuelle ne propage pas la suppression et ne réaffecte pas les descendants ; ils peuvent devenir invisibles dans l'arbre. Réaffectez ou supprimez tous les enfants d'abord. L'inventaire lié perd son affectation de zone.

## La validation frontend échoue

Isolez la commande :

```bash
cd frontend
pnpm type-check
pnpm lint
pnpm format:check
pnpm test:unit
```

L'application utilise Oxlint. L'existence du paquet publié `@stocketfr/eslint-config` ne signifie pas que les applications exécutent actuellement ESLint.

## Les vérifications backend échouent

```bash
cd backend
pnpm type-check
pnpm lint
pnpm test
pnpm test:integration
```

Les tests d'intégration exigent PostgreSQL et utilisent `TEST_DATABASE_URL` s'il est défini. Séparez d'abord les échecs unitaires et d'intégration.

## La documentation API semble incomplète

Swagger UI se trouve sur `http://localhost:8080/docs`, pas `/api/docs`, et ne
documente actuellement que la santé. Les routeurs backend montés définissent les
endpoints actifs ; leurs schémas `@stocketfr/types` correspondants définissent
les payloads. Tout schéma exporté n'est pas forcément monté : fulfillment reste
par exemple un prototype non monté.

## Une page française retombe en anglais

Le site utilise la localisation par suffixe (`page.fr.md`) avec repli anglais. Vérifiez le suffixe, le sélecteur de langue et la présence de la page dans la navigation `mkdocs.yml`.

## Toujours bloqué

Notez la commande, le dépôt et la révision, les versions Node/pnpm, les logs utiles et un résumé d'environnement expurgé. Ouvrez l'issue dans le dépôt propriétaire ; le dépôt documentation ne sert qu'aux défauts documentaires.
