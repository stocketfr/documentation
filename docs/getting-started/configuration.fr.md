# Configuration

La configuration Stocket est séparée par processus. Infisical est la source
opérationnelle des secrets ; les fichiers `env.template` sont des références.

## Processus backend

L'API et le worker partagent base, hôtes tenant, stockage, logs et observabilité.
Le worker ne compose pas le layer auth, mais son graphe d'entrée importe
immédiatement la configuration auth partagée. Il exige donc Better Auth/frontend
et la configuration e-mail de staging/production. L'API exige en plus son port
HTTP et les origines CORS. Smart Import peut appeler
une API compatible OpenAI. Concurrence, leases, heartbeats, polling, reprise,
retry et limitation des progrès du worker sont configurables.

L'API valide `NODE_ENV` et `PORT` à l'entrée. Les identifiants comme
`DATABASE_URL`, `BETTER_AUTH_SECRET` et les clés S3 doivent être présents avant
l'initialisation des layers.

Voir la [référence des variables](../reference/environment-variables.md).

## Processus frontend

L'application web utilise des valeurs runtime côté serveur :

| Variable | Rôle |
|----------|------|
| `INTERNAL_API_ORIGIN` | origine privée utilisée par SSR et le proxy Vite `/api` |
| `WEB_URL` | origine web canonique utilisée par Better Auth côté serveur |
| `TENANT_BASE_DOMAIN` | suffixe des hôtes tenant |
| `PLATFORM_HOST` | hôte d'administration plateforme |
| `TRUSTED_PROXY` | `1` uniquement derrière un proxy de confiance gérant les en-têtes forwarded |
| `PORT`, `HOST` | adresse d'écoute du serveur Node de production |

Le navigateur utilise `/api/v1` et `/api/auth` sur la même origine ; il n'a pas
besoin de `VITE_API_BASE_URL`. `VITE_CSP_NONCE` est la seule valeur de build
navigateur optionnelle actuellement référencée.

## Services locaux

`meta/docker-compose.yml` fournit PostgreSQL et MinIO. `pnpm start:workspace`
ajoute des valeurs locales, tandis que les secrets viennent d'Infisical.

```bash
docker compose -f meta/docker-compose.yml up -d --wait postgres minio
docker compose -f meta/docker-compose.yml up minio-init
```

## Tenancy

- plateforme locale : `localhost:3000`
- tenant local : `<slug>.localhost:3000`
- plateforme hébergée : `PLATFORM_HOST`
- tenants hébergés : sous-domaines de `TENANT_BASE_DOMAIN` ou domaines vérifiés

Le proxy web transmet l'hôte/protocole d'origine. N'activez `TRUSTED_PROXY=1`
que derrière un reverse proxy de confiance.

## Documentation API

Swagger est monté sur `http://localhost:8080/docs`. Il ne couvre actuellement
que le groupe santé migré vers Effect `HttpApiBuilder` ; consultez les routers
et contrats partagés pour le reste.

## Suite

- [Variables d'environnement](../reference/environment-variables.md)
- [Architecture](../development/architecture.md)
- [Configuration de développement](../development/setup.md)
