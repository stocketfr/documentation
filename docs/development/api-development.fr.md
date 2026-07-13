# Développement API

Le backend Stocket s'exécute avec Node.js 22, Effect, Drizzle ORM et PostgreSQL. `tsx` lance les points d'entrée de développement ; esbuild produit des bundles CommonJS pour Node 22 en production. Bun n'est pas le runtime du backend.

## Runtime et composition de l'application

Les points d'entrée restent volontairement légers :

- `src/effect/main.ts` valide `NODE_ENV` et `PORT`, construit les layers applicatifs et HTTP, puis appelle `NodeRuntime.runMain()`.
- `src/effect/task-worker.ts` construit le worker de tâches durables sans démarrer de serveur HTTP.
- `src/effect/application/layers.ts` centralise la composition des services et de la plateforme.
- `src/effect/application/startup.ts` gère les migrations de démarrage, le seed des rôles par défaut et le scanner de notifications.
- `src/effect/modules/index.ts` monte les routers des modules sous `/api/v1`.
- `src/effect/http/app.ts` assemble les routers, Better Auth, l'API de santé, Swagger et les middlewares.

Le point d'entrée de l'API suit cette forme :

```typescript
const applicationLayer = makeApplicationLayer({
  nodeEnv,
  runBetterAuthMigrations:
    process.env.RUN_BETTER_AUTH_MIGRATIONS === 'true',
});

const main = Layer.launch(makeHttpServerLayer(port)).pipe(
  Effect.provide(applicationLayer),
  Effect.provide(runtimeLoggingLayer),
);

NodeRuntime.runMain(main);
```

`platformLayer` fournit la base de données, Better Auth et le stockage objet. Les services de fonctionnalités sont composés au-dessus, puis les services de modules et les workflows inter-modules. Ajoutez le nouveau câblage dans `application/layers.ts`, pas dans le point d'entrée.

## Anatomie d'un module et contrats partagés

Les répertoires de modules se trouvent sous `src/effect/modules/<module>/`. Ils ne suivent pas un modèle de fichiers obligatoire. Un module contient généralement :

```text
router.ts              frontière HTTP
service.ts             cas d'usage et règles métier
repository.ts          persistance limitée au tenant
types.ts               types internes
mappers.ts             conversion base de données vers réponse
write.ts               workflows d'écriture, si utile
<module>.errors.ts     erreurs de domaine et d'infrastructure typées
*.spec.ts              tests ciblés
```

Les DTO publics, enums, identifiants, schémas de requête et schémas de corps appartiennent à `packages/types` et sont importés via l'export du domaine :

```typescript
import {
  ClientIdSchema,
  ClientQuerySchema,
  CreateClientSchema,
  UpdateClientSchema,
} from '@stocket/types/clients';
```

Conservez près du router les structures propres à une route, par exemple `{ id: ClientIdSchema }`. Conservez les lignes de base de données et les types internes aux workflows dans le module backend. Après l'ajout d'un fichier public au package partagé, régénérez ses barrels :

```bash
pnpm --dir packages/types barrels
```

## Erreurs typées

Les erreurs de domaine utilisent les factories de `platform/effect/domain-errors.ts`. Chaque erreur applicative possède un tag unique, un statut HTTP, un `messageKey` et des arguments de message typés optionnels.

```typescript
import {
  ConflictError,
  InternalError,
  NotFoundError,
} from '../../platform/effect/domain-errors';

export class ClientNotFound extends NotFoundError('ClientNotFound')<{
  readonly id: string;
}> {}

export class ClientEmailAlreadyExists extends ConflictError(
  'ClientEmailAlreadyExists',
)<{ readonly email: string }> {}

export class ClientsInfrastructureError extends InternalError(
  'ClientsInfrastructureError',
)<{ readonly action: string; readonly cause?: unknown }> {}
```

Les factories disponibles correspondent aux statuts `400`, `401`, `403`, `404`, `409`, `500` et `501`. Les erreurs de parsing de schéma deviennent des `400` ; les erreurs inconnues deviennent des `500` et sont masquées en production. Les helpers de réponse standard localisent les messages depuis les catalogues anglais, français et allemand.

## Repositories limités au tenant et transactions

Les données appartenant à un tenant doivent tirer leur tenant du contexte de requête, jamais d'un `tenant_id` fourni par le client. Préférez `makeTenantCrud()` pour le CRUD conventionnel. Il utilise `TenantQuery` pour ajouter le tenant aux insertions et limiter les lectures, mises à jour et suppressions.

```typescript
export class ClientsRepository extends Effect.Service<ClientsRepository>()(
  '@stocket/effect/clients/ClientsRepository',
  {
    effect: makeTenantCrud(clients, {
      entity: 'client',
      onError: (action, cause) =>
        new ClientsInfrastructureError({
          action,
          cause,
          messageKey: 'clients.repositoryFailed',
        }),
      list: {
        filters: buildClientFilters,
        orderBy: sql`"company_name" ASC`,
      },
    }),
    dependencies: [TenantQuery.Default],
  },
) {}
```

Pour les requêtes spécifiques, utilisez les helpers limités au tenant exposés par `makeTenantCrud()` (`scopedWhere`, `scopedWhereId`, `scopedWhereIds`, `insertValues`) ou directement `TenantQuery`. Un identifiant d'un autre tenant doit se comporter comme un identifiant absent.

Utilisez le helper de repository `withTransaction`, ou `withDrizzleTransaction`, lorsque plusieurs écritures en base forment un seul invariant. Gardez la validation et les écritures dans la même transaction lorsque la concurrence compte ; une vérification préalable applicative n'est pas une garantie d'unicité en base. Ne maintenez pas une transaction ouverte pendant un appel S3, email, LLM ou réseau. Les écritures d'audit sont également hors de la transaction métier.

Convertissez les rejets de promesses en erreur d'infrastructure du module avec `makeTryAsync()` ou le wrapper fourni par `makeTenantCrud()`.

## Services et frontières des modules

Les services exposent les cas d'usage, convertissent les lignes en DTO publics et tracent leurs opérations. Les routers HTTP doivent appeler les services, pas les repositories.

Pour une collaboration inter-module normale, dépendez du service de l'autre module. Pour un workflow inter-module réellement atomique, créez un orchestrateur explicite ou un repository coordinateur et injectez des capacités `Pick<...>` étroites. La propriété de la transaction reste ainsi visible sans disperser les imports de repositories dans les routers et services sans rapport.

Déplacez un helper dans `platform/` seulement lorsqu'il est indépendant du domaine et réutilisé. Conservez les règles de produit, commande, inventaire et tenant dans leurs modules propriétaires. Ne dupliquez pas la validation d'un autre module uniquement pour éviter une dépendance de service.

Le câblage des layers appartient à `application/layers.ts` ; le montage des routes à `modules/index.ts`.

## Routes HTTP

### `tenantRoute` et `tenantRouteContext`

La plupart des routes d'API tenant utilisent les adaptateurs de `platform/http/tenant-route.ts` :

- `tenantRoute()` autorise, applique un guard optionnel, décode l'entrée, résout le mode de session demandé, exécute le handler et renvoie une réponse JSON standard.
- `tenantRouteContext()` effectue le même travail de frontière mais renvoie l'Effect du contexte décodé. Utilisez-le avec `respondAuditedMutation()`, un statut ou header personnalisé, ou une réponse vide.
- `queryParams()`, `pathParams()`, `jsonBody()` et les décodeurs combinés gardent le parsing à la frontière.

L'ordre de la frontière est : permissions, guard personnalisé, décodage, puis résolution explicite de la session. Une vérification de permission exige déjà une authentification. Définissez `session: 'required'` ou `'optional'` lorsque le handler a aussi besoin de `session` ou `userId` ; sinon la valeur par défaut est `'none'`.

```typescript
const ClientPathParams = Schema.Struct({ id: ClientIdSchema });

export const clientsRouter = HttpRouter.empty.pipe(
  HttpRouter.get(
    '/',
    tenantRoute({
      permissions: [[Resource.CLIENTS, Permission.READ]],
      decode: queryParams(ClientQuerySchema),
      handler: ({ input: query }) =>
        Effect.flatMap(ClientsService, (clients) =>
          clients.findAllPaginated(query),
        ),
    }),
  ),
  HttpRouter.post(
    '/',
    tenantRouteContext({
      permissions: [[Resource.CLIENTS, Permission.WRITE]],
      decode: jsonBody(CreateClientSchema),
    }).pipe(
      Effect.flatMap(({ input: dto }) =>
        respondAuditedMutation(
          Effect.flatMap(ClientsService, (clients) => clients.create(dto)),
          {
            action: AuditAction.CREATE,
            entityType: AuditEntityType.CLIENT,
            entityId: (client) => client.id,
            responseOptions: { status: 201 },
          },
        ),
      ),
    ),
  ),
  HttpRouter.prefixAll('/clients'),
);
```

### Authentification, RBAC et guards de fonctionnalités

Better Auth sert `/api/auth/**`. Les routes tenant résolvent le hostname vérifié avant que les repositories n'utilisent le contexte du tenant. N'acceptez jamais un hostname ou un identifiant de tenant comme autorisation à lui seul : la session doit aussi avoir une adhésion à ce tenant.

Déclarez les exigences RBAC sur la route :

```typescript
tenantRoute({
  permissions: [[Resource.ORDERS, Permission.READ]],
  guard: requireOrdersFeature,
  decode: queryParams(OrderQuerySchema),
  handler: ({ input }) =>
    Effect.flatMap(OrdersService, (orders) =>
      orders.findAllPaginated(input),
    ),
});
```

Le RBAC indique si l'utilisateur peut effectuer une action. Un guard de fonctionnalité indique si le plan ou l'override du tenant active cette capacité produit. Ce sont deux vérifications distinctes. Les clés actuelles sont `orders` et `smartImport` ; Smart Import exige aussi les permissions d'écriture pour les produits, emplacements et inventaires.

Les ressources RBAC exactes sont :

| Ressource | Périmètre habituel |
| --- | --- |
| `DASHBOARD` | Accès au tableau de bord |
| `ORDERS` | Commandes |
| `CLIENTS` | Clients |
| `SUPPLIERS` | Fournisseurs |
| `STOCK_MOVEMENTS` | Registre des mouvements |
| `PRODUCTS` | Catalogue de produits et photos |
| `LOCATIONS` | Emplacements et zones |
| `INVENTORY` | Lignes et ajustements d'inventaire |
| `AUDIT_LOGS` | Lecture de l'audit tenant |
| `USERS` | Utilisateurs du tenant |
| `SETTINGS` | Paramètres et branding du tenant |
| `ROLES` | Rôles et attributions |

Les permissions sont `READ` et `WRITE`. Il n'existe pas de ressource `STOCK`. Les écritures de rôles et d'attributions invalident le cache des permissions ; les écritures de fonctionnalités invalident le cache des droits produit.

## Contrats de réponse

Les routes renvoient directement leur entité ou leur message. Il n'existe pas de layer HATEOAS et `_links` n'est pas garanti dans les réponses. Les statuts et corps de suppression dépendent de la route ; ne supposez pas que chaque suppression renvoie `204`.

Les réponses paginées standard contiennent un objet `meta` imbriqué :

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "total_pages": 0,
    "has_next": false,
    "has_previous": false
  }
}
```

Les opérations en masse utilisent le contrat partagé `BulkOperationResult` :

```json
{
  "success_count": 2,
  "failure_count": 1,
  "succeeded": ["id-1", "id-2"],
  "failures": [
    { "id": "id-3", "error": "Produit introuvable" }
  ]
}
```

Utilisez `runBulkByIds()` depuis `platform/effect/run-bulk-by-ids.ts` pour les workflows en masse par identifiants, ou les builders de `@stocket/types/common` lorsqu'un workflow nécessite des identifiants personnalisés.

`respondJson()` et `respondEmpty()` ajoutent `x-request-id`, localisent les descripteurs de message et convertissent les erreurs typées en enveloppe d'erreur standard. Les réponses Better Auth, Swagger, health typées et les preflights CORS ne passent pas toutes par ces helpers : ne promettez donc pas ce header sur toutes les réponses possibles.

## Journalisation d'audit

Utilisez `respondAuditedMutation()` uniquement pour les mutations dont l'événement d'audit tenant fait partie du contrat actuel. Il produit la réponse après le succès de la mutation et demande à `AuditLogWriter` d'écrire un événement dans une fibre daemon.

Les routers actuellement audités côté tenant couvrent les zones, catégories, clients, inventaires, emplacements, commandes, produits, rôles, mouvements de stock et fournisseurs. Cela ne signifie pas que chaque mutation du système est auditée. Les utilisateurs, le branding, les photos, les préférences de notification et les tâches sont des exemples hors de cette couverture ; les opérations superadmin utilisent un audit plateforme séparé.

Les lignes d'audit tenant enregistrent actuellement l'action, le type et l'identifiant d'entité, l'identifiant utilisateur si disponible, l'adresse IP et l'horodatage. `changes` et `user_agent` valent actuellement `null`. L'écriture est best-effort, son échec est journalisé puis ignoré, et elle n'appartient pas à la transaction métier. N'utilisez pas ce journal comme historique exhaustif, source de rollback ou garantie réglementaire.

## Observabilité

### Traçage des services

Créez un tracer une fois par service et enveloppez les opérations publiques avec `span()` ou `traced()` :

```typescript
const trace = makeServiceTracer({
  serviceName: 'ClientsService',
  module: 'clients',
  layer: 'service',
});

const findOne = (id: string) =>
  repository.findById(id).pipe(
    trace.span('findOne', { attributes: { id } }),
  );
```

`makeServiceTracer()` ajoute le module, le layer, l'opération, l'identifiant de requête, l'identifiant du tenant si disponible et une classification du résultat. Utilisez les attributs de traçage catalogués plutôt que des clés arbitraires.

### Logs structurés et localisés

`createLogger()` vient de `platform/observability/messages.ts`. Son scope préfixe la clé de message et ses arguments sont limités par `LogProperties` dans `platform/catalogs/log-properties.ts`.

```typescript
const logger = createLogger('tasks');

yield* logger.info('settled', {
  taskId,
  taskType,
  workerId,
  status,
});
```

Les catalogues de messages se trouvent dans `platform/catalogs/en.ts`, `fr.ts` et `de.ts`. Gardez leurs clés synchronisées ; l'anglais définit l'ensemble typé `MessageKey`. Évitez les logs console non structurés.

### Middlewares HTTP

Pour une requête entrante, les middlewares enveloppent l'application dans cet ordre :

1. journalisation de requête et contexte de requête ;
2. headers de sécurité ;
3. CORS, y compris les origines de tenants vérifiées ;
4. limite de corps de requête à 10 Mio ;
5. contexte du tenant ;
6. router.

Le contexte de requête standard contient l'identifiant de requête, le chemin, la méthode, l'IP, la locale et l'identifiant de tenant résolu.

## Santé et découverte de l'API

Les endpoints publics de santé sont :

| Endpoint | Vérification | Échec |
| --- | --- | --- |
| `GET /health-check/live` | Vivacité du processus uniquement | Aucune dépendance vérifiée |
| `GET /health-check/ready` | Connectivité PostgreSQL | `503` si la base est indisponible |
| `GET /health-check` | PostgreSQL et secret Better Auth | `503` si l'un des deux est indisponible |

Une réponse de santé réussie utilise `status`, `info`, `error` et `details` :

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "better-auth": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up" },
    "better-auth": { "status": "up" }
  }
}
```

L'interface Swagger est montée sur `/docs`, mais elle ne décrit actuellement que le groupe health implémenté avec `HttpApiBuilder`. La plupart des modules `/api/v1` utilisent encore `HttpRouter` et n'apparaissent pas dans ce document OpenAPI. Considérez Swagger comme partiel jusqu'à leur migration.

## Tâches durables et worker

Les traitements longs ou à réessayer doivent être placés dans une tâche durable au lieu de rester dans la fibre de requête. L'API et le worker sont des processus séparés :

```bash
pnpm --filter @stocket/api start
pnpm --filter @stocket/api start:worker
```

Les tâches prennent les états `queued`, `running`, `succeeded`, `failed` et `canceled`, avec progression, tentatives, leases, heartbeats, retry différé, récupération et annulation coopérative. La lecture et l'annulation exigent une session et sont limitées au tenant et à l'utilisateur créateur :

- `GET /api/v1/tasks`
- `GET /api/v1/tasks/:id`
- `POST /api/v1/tasks/:id/cancel`

L'import produit est actuellement le seul type de tâche enregistré. `POST /api/v1/products/import` renvoie `202` avec la tâche et un header `Location: /api/v1/tasks/:id`. Son `Idempotency-Key` est limité au tenant, au créateur et au type de tâche.

Pour ajouter un type de tâche, définissez et validez son payload, implémentez un `TaskHandler`, enregistrez-le dans le layer `TaskRegistry` du worker, ajoutez ses dépendances au layer applicatif du worker et exposez un service d'enqueue. Le processus HTTP peut créer les tâches ; seul le worker doit les exécuter.

## Vérification rapide

Pour les changements d'API backend, lancez d'abord les vérifications pertinentes les plus petites :

```bash
pnpm --filter @stocket/api type-check
pnpm --filter @stocket/api lint
pnpm --filter @stocket/api test -- clients
```

Utilisez le nom du module concerné comme filtre Vitest. Lancez les tests d'intégration lorsque la persistance, les transactions, le tenant ou la composition des routes changent.
