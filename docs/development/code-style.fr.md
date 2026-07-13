# Style de code

Les dépôts Stocket partagent des contrats TypeScript mais gardent leurs propres outils. Suivez la configuration et le code voisin du dépôt modifié ; aucune commande racine ne couvre automatiquement tous les projets.

## TypeScript général

- Conservez le typage strict et évitez `any`. Réduisez `unknown` à la frontière d'un adaptateur lorsque l'entrée externe ne peut être typée directement.
- Préférez l'inférence pour les fonctions locales et des types publics explicites lorsqu'ils clarifient le contrat.
- Utilisez `import type` pour les dépendances de type.
- Préservez les champs snake_case des DTO API publiés ; les noms propres à l'UI restent à sa frontière.
- Décodez les entrées externes avec les schémas partagés au lieu de caster.
- Gardez les changements assez ciblés pour que les vérifications du dépôt propriétaire restent la référence.

## Contrats partagés

Requêtes, réponses, enums et schémas communs vivent dans `packages/types` et sont publiés sous `@stocketfr/types`. Les consommateurs passent par l'alias et un sous-chemin :

```ts
import { Permission, Resource } from '@stocket/types/auth'
import { CreateProductRequestSchema } from '@stocket/types/products'
```

Modifiez d'abord le contrat dans packages, ajoutez un Changeset, publiez ou utilisez le snapshot approuvé, puis mettez les consommateurs à jour. Ne dupliquez pas un schéma dans backend et frontend pour contourner ce cycle.

## Conventions backend

Le backend exécute Node 22 avec Effect et Drizzle. Un module courant sous `src/effect/modules/<nom>/` contient `router.ts`, `service.ts`, `repository.ts`, `mappers.ts`, `types.ts` et des erreurs typées. Les modules complexes séparent aussi écritures, requêtes, validations, états ou orchestration. Adaptez la structure au besoin réel.

Responsabilités :

- **router** — chemin/méthode, décodage par schéma partagé, permissions/fonctionnalités, réponse HTTP ;
- **service/workflow** — règles métier et composition ;
- **repository** — persistance tenant via `TenantQuery`/Drizzle ;
- **mapper** — valeurs de base/domaine vers les DTO publiés ;
- **errors** — erreurs métier/infrastructure typées.

Utilisez `Effect.Service`, les erreurs taguées et le canal d'erreur Effect. Ne lancez pas d'exception pour une condition métier attendue. Réutilisez les helpers de `platform/effect`, `platform/db` et `platform/http`.

Les routes tenant déclarent accès et décodage ensemble :

```ts
HttpRouter.post(
  '/',
  tenantRouteContext({
    permissions: [[Resource.PRODUCTS, Permission.WRITE]],
    decode: jsonBody(CreateProductRequestSchema),
    session: 'optional',
  }).pipe(
    Effect.flatMap(({ input, userId }) =>
      respondAuditedMutation(
        Effect.flatMap(ProductsService, (service) =>
          service.create(input, userId),
        ),
        {
          action: AuditAction.CREATE,
          entityType: AuditEntityType.PRODUCT,
          entityId: (product) => product.id,
          responseOptions: { status: 201 },
        },
      ),
    ),
  ),
)
```

Utilisez `tenantRoute` pour une réponse JSON normale et `tenantRouteContext` lorsque réponse/audit exige le contexte décodé. Ajoutez un `guard` de fonctionnalité à côté des permissions. L'audit de `respondAuditedMutation` est une métadonnée au mieux après succès, hors transaction ; ne l'utilisez jamais pour orchestrer la transaction.

Les services utilisent `makeServiceTracer` depuis `platform/observability/service-tracer`. Journalisez des clés/propriétés structurées, jamais secrets ou DTO entiers. Une transaction explicite transmet la surface de requête transactionnelle ; une composition inter-modules est valable si un orchestrateur possède le cas d'usage.

## Conventions frontend

Le frontend utilise React 19, TanStack Start/Router/Query/Form, StyleX, Tailwind 4 et shadcn/Radix.

- Importez le code applicatif avec `@/`, pas l'ancien `~/`.
- Les routes vivent sous `src/routes` ; ne modifiez jamais `routeTree.gen.ts` généré.
- Placez les hooks API/query sous `src/lib/data` et utilisez le sous-chemin DTO partagé.
- Protégez les routes avec `requireRouteAccess(currentUser, Resource, options)` en miroir du serveur.
- Conservez les filtres partageables dans des paramètres de recherche URL validés.
- Utilisez les clés/options de requête générées pour invalidation et chargement conditionnel.
- Utilisez StyleX ou Tailwind/shadcn selon le modèle du composant voisin, sans migration incidente.
- Traitez labels, clavier, focus, erreurs, chargement et vide comme partie de la fonctionnalité.

N'utilisez pas de global navigateur lors du SSR. Loaders et fonctions serveur transmettent hôte, protocole et cookie via les adaptateurs API même origine existants.

## Formatage et lint

Backend et frontend utilisent Prettier et Oxlint. Le paquet `@stocketfr/eslint-config` est publié mais ne rend pas ESLint actif dans les applications.

```bash
# backend
pnpm format
pnpm lint
pnpm type-check

# frontend (vérifications sans modification)
pnpm format:check
pnpm lint
pnpm type-check
```

Laissez le formateur décider ponctuation et retours. Ne mélangez pas un reformatage global à une évolution fonctionnelle.

## Documentation

Synchronisez la structure anglaise et `.fr.md`. Utilisez liens relatifs, blocs avec langage et avertissements pour les opérations destructrices/non atomiques. Ajoutez toute page navigable à `mkdocs.yml` et vérifiez liens/navigation. La CI exécute `mkdocs build --strict`.
