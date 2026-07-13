# Variables d'environnement

Stocket utilise Infisical comme source opérationnelle des secrets. Les fichiers `backend/env.template` et `frontend/env.template` sont des inventaires de référence, pas des fichiers `.env` à valider. Dans chaque application, `pnpm start` passe par la CLI Infisical.

Ne validez jamais d'identifiants. Les valeurs de production sont rendues par le dépôt infrastructure et doivent être modifiées via le flux de gestion des secrets correspondant.

## API backend

### Cœur et hôtes

| Variable | Requise | Défaut/référence | Rôle |
| --- | --- | --- | --- |
| `DATABASE_URL` | Oui | aucun | URL de connexion PostgreSQL. |
| `NODE_ENV` | Oui | référence : `development` | L'API accepte `development`, `staging` ou `production` ; le worker l'exige aussi. Les tests définissent leur propre contexte. |
| `PORT` | API : oui | référence : `8080` | Port de l'API, entier de 1 à 65535. |
| `TENANT_BASE_DOMAIN` | Oui | `stocket.fr` | Domaine parent utilisé pour résoudre les tenants. |
| `PLATFORM_HOST` | Oui | `app.stocket.fr` | Hôte réservé à la console plateforme. |
| `RESERVED_TENANT_SLUGS` | Non | liste intégrée | Slugs séparés par des virgules interdits aux tenants. |
| `CORS_ORIGIN` | Oui | `http://localhost:3000` | Origines non vides séparées par des virgules. `*` est refusé en production (utilisez aussi des origines explicites en staging) ; les origines tenant vérifiées sont autorisées dynamiquement. |
| `FRONTEND_URL` | Oui | `http://localhost:3000` | Origine(s) utilisées par l'authentification et les liens e-mail. |

En développement local, `localhost` est l'hôte plateforme et les tenants utilisent `<slug>.localhost:3000`.

### Authentification et scripts d'administration explicites

| Variable | Requise | Rôle |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Oui | Secret de signature Better Auth, fort et géré hors tests. |
| `BETTER_AUTH_URL` | Oui | Origine publique du backend/auth, normalement `http://localhost:8080` en local. |
| `BETTER_AUTH_COOKIE_DOMAIN` | Non | Surcharge explicite du domaine partagé ; sans elle, auth dérive si possible un suffixe commun auth/frontend. |
| `RUN_BETTER_AUTH_MIGRATIONS` | Non (garde production) | En production, `true` active SQL commité, préparation des marqueurs, migration/réparation Better Auth et migrations superadmin en attente. Hors production, la séquence s'exécute automatiquement ; le nettoyage des hôtes reste propre au développement. |
| `SUPERADMIN_EMAIL` | Migration/seed en attente | E-mail utilisé par les migrations de données en attente ou le script explicite. |
| `SUPERADMIN_NAME` | Migration/seed en attente | Nom d'un compte nouvellement créé. |
| `SUPERADMIN_PASSWORD` | Migration/seed en attente | Mot de passe en clair alternatif ; préférez le hash. |
| `SUPERADMIN_PASSWORD_HASH` | Migration/seed en attente | Hash imprimé par `superadmin:hash-password`. |
| `SUPERADMIN_ROTATE_PASSWORD` | Non | Autorise le seed explicite et la migration `0000` à remplacer le mot de passe ; `0001` force la rotation. |
| `SUPERADMIN_ALLOW_TENANT_MEMBER` | Non | Doit valoir `true` pour promouvoir volontairement un compte déjà membre d'un tenant. |

Les valeurs superadmin sont consommées si les marqueurs de migration `0000_seed_platform_superadmin` ou `0001_reconcile_platform_superadmin_password` sont encore en attente ; la migration de réconciliation force la rotation. Elles servent aussi à l'exécution explicite de `src/scripts/seed-superadmin.ts`. Le seed tenant accepte `TENANT_ADMIN_EMAIL`, `TENANT_ADMIN_NAME`, `TENANT_ADMIN_PASSWORD` ou `TENANT_ADMIN_PASSWORD_HASH`, et `TENANT_ADMIN_ROTATE_PASSWORD`. Ciblez un tenant existant avec `TENANT_ADMIN_TENANT_ID` ou `TENANT_ADMIN_TENANT_SLUG` (jamais les deux) ; `TENANT_ADMIN_TENANT_HOSTNAME` définit éventuellement son hôte principal. Sans cible, il choisit l'unique tenant, demande parmi plusieurs, ou crée le tenant par défaut s'il n'en existe aucun. Il remplace les données de démo du tenant choisi.

### Réglage de la connexion base

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `DB_SSL` | `false` | Active TLS pour PostgreSQL. |
| `DB_SSL_REJECT_UNAUTHORIZED` | `true` | Valide le certificat serveur lorsque TLS est actif. |
| `DB_POOL_MAX` | `20` | Maximum positif par pool ; Better Auth et Drizzle créent chacun leur pool. |

### E-mail et journalisation

| Variable | Requise | Défaut/référence | Rôle |
| --- | --- | --- | --- |
| `RESEND_API_KEY` | Staging/production | vide | Identifiant Resend. En développement/test, les e-mails sont journalisés. |
| `EMAIL_FROM` | Staging/production | référence template : `Stocket <no-reply@mail.stocket.fr>` | Identité explicite. Le fallback développement/test est `Stocket <onboarding@resend.dev>`. |
| `LOG_FORMAT` | Non | `text` | `text` ou `json` ; l'infrastructure utilise `json`. |
| `LOG_LEVEL` | Non | défaut runtime | Seuil de logs Effect. |
| `LOG_SQL` | Non | `off` | `off`, `summary` ou `full` ; évitez full autour de données sensibles. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Non | `http://localhost:4318/v1/traces` | Endpoint HTTP OTLP des traces. |

### Stockage objet

Ces six réglages sont requis au démarrage de l'API et du worker dans la composition globale actuelle, même si la fonctionnalité immédiate n'utilise ni photo ni import.

| Variable | Référence locale | Rôle |
| --- | --- | --- |
| `S3_ENDPOINT` | `http://localhost:9000` | Endpoint compatible S3. |
| `S3_REGION` | `us-east-1` | Région du bucket. |
| `S3_ACCESS_KEY_ID` | `minio` | Clé d'accès. |
| `S3_SECRET_ACCESS_KEY` | `minio123` | Clé secrète. |
| `S3_BUCKET` | `stocket-local` | Bucket existant. |
| `S3_FORCE_PATH_STYLE` | `true` | Requis pour MinIO local ; généralement false en hébergé. |

### Smart Import

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `PRODUCT_IMPORT_LLM_ENABLED` | `true` | Active la couche optionnelle de propositions IA. |
| `OPENAI_API_KEY` | vide | Identifiant fournisseur. Vide, les propositions déterministes prennent le relais. |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Base d'une API compatible OpenAI. |
| `PRODUCT_IMPORT_LLM_MODEL` | `gpt-5-mini` | Modèle de proposition. |
| `PRODUCT_IMPORT_LLM_TIMEOUT_MS` | `15000` | Délai positif en millisecondes. |

### Worker de tâches

L'API place les tâches durables dans PostgreSQL ; `pnpm start:worker` les exécute séparément. Le worker n'utilise pas auth, mais son graphe importe actuellement cette configuration avec empressement. Il exige donc `NODE_ENV`, `TENANT_BASE_DOMAIN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` et `FRONTEND_URL` en plus de la base, du stockage et des tâches (plus l'e-mail de staging/production). `PLATFORM_HOST` n'est pas requis par le worker. Gardez les valeurs partagées alignées jusqu'à suppression de ce couplage.

| Variable | Défaut | Contrainte |
| --- | ---: | --- |
| `BACKGROUND_TASK_CONCURRENCY` | `4` | 1 à 32 tâches. |
| `BACKGROUND_TASK_LEASE_MS` | `60000` | Durée de bail positive. |
| `BACKGROUND_TASK_HEARTBEAT_MS` | `15000` | Doit être inférieure au bail. |
| `BACKGROUND_TASK_POLL_MS` | `1000` | Intervalle d'attente positif. |
| `BACKGROUND_TASK_RECOVERY_MS` | `30000` | Intervalle positif de récupération. |
| `BACKGROUND_TASK_RETRY_DELAY_MS` | `30000` | Délai de nouvel essai positif. |
| `BACKGROUND_TASK_PROGRESS_THROTTLE_MS` | `500` | Limitation positive des écritures de progression. |

## Runtime SSR frontend

| Variable | Requise | Défaut/référence | Rôle |
| --- | --- | --- | --- |
| `INTERNAL_API_ORIGIN` | Oui | `http://localhost:8080` | Origine serveur-à-serveur pour le SSR et le proxy Vite. Le navigateur appelle toujours `/api/v1` sur la même origine. |
| `WEB_URL` | Oui | `http://localhost:3000` | Origine web canonique. |
| `TENANT_BASE_DOMAIN` | Oui | `stocket.fr` | Doit correspondre au modèle d'hôtes du backend. |
| `PLATFORM_HOST` | Oui | `app.stocket.fr` | Doit correspondre à l'hôte plateforme backend. |
| `TRUSTED_PROXY` | Non | vide | `1` uniquement derrière un proxy de confiance qui fixe les en-têtes forwarded. |
| `PORT` | Non | `3000` | Port du serveur SSR de production. |
| `HOST` | Non | `127.0.0.1` | Adresse d'écoute du serveur SSR. |
| `VITE_CSP_NONCE` | Non | vide | Nonce optionnel de build compilé via `import.meta.env` et transmis au routeur. |

Le chemin actuel des requêtes n'utilise pas `VITE_API_BASE_URL`.

## Réglages réservés aux tests

- Les tests d'intégration backend utilisent `TEST_DATABASE_URL` s'il est fourni.
- Le smoke test optionnel contre un vrai MinIO ne s'exécute qu'avec `RUN_MINIO_STORAGE_SMOKE=true` et un service accessible.
- La requête de seed E2E envoie `x-e2e-seed-secret`. Le développement l'autorise sans secret configuré ; les autres environnements hors production exigent un `E2E_SEED_SECRET` correspondant ; la production désactive toujours l'endpoint.
- Le seed E2E backend reconnaît `E2E_DATABASE_URL`, `E2E_TENANT_SLUG`, `E2E_TENANT_NAME`, `E2E_TENANT_HOSTNAME` et `E2E_USER_EMAIL`.
- Les tests frontend utilisent `E2E_FRONTEND_ORIGIN` (référence : `http://e2e.localhost:3000`) et les variables définies par Playwright et le workflow CI.

Les identifiants de test et valeurs de seed ne doivent jamais être réutilisés en environnement déployé.
