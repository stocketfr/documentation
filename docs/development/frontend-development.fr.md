# Développement frontend

L'application web Stocket est une application React avec rendu serveur, construite avec TanStack Start. Ce guide décrit les conventions du frontend actuel.

## Stack technique

- React 19 et TanStack Start/Router
- TanStack Query pour l'état serveur et l'hydratation SSR
- TanStack Form avec validation Zod
- Better Auth pour l'authentification par e-mail et mot de passe
- StyleX pour les styles de fonctionnalités et de mise en page
- Tailwind CSS 4 et shadcn/Radix pour les primitives d'interface
- i18next pour l'anglais, l'allemand et le français
- Vitest, Testing Library et Playwright

## Cartographie des sources

```text
frontend/
├── public/                         # Manifeste, service worker, page hors ligne, icônes
├── e2e/                            # Configuration, fixtures et tests Playwright
└── src/
    ├── routes/
    │   ├── __root.tsx              # Document HTML et providers globaux
    │   ├── _authed.tsx             # Hôte, session et layout authentifié
    │   ├── _authed/                # Routes de l'application locataire
    │   ├── login.tsx               # Routes publiques d'authentification
    │   ├── signup.tsx
    │   ├── forgot-password.tsx
    │   ├── reset-password.tsx
    │   └── platform.tsx            # Console de l'hôte plateforme
    ├── components/
    │   ├── ui/                     # Primitives shadcn/Radix partagées
    │   ├── products/import-wizard/ # Revue et exécution de Smart Import
    │   └── <module>/               # Composants fonctionnels
    ├── hooks/                       # Orchestration et hooks de formulaires
    ├── lib/
    │   ├── data/                   # Hooks API/requête/mutation typés
    │   ├── router/                 # Contexte, protections et schémas de recherche
    │   ├── server/                 # Fonctions serveur et gestion de l'hôte
    │   └── stylex/                 # Styles et marqueurs StyleX partagés
    ├── locales/{en,de,fr}/
    ├── router.tsx                  # Intégration QueryClient et Router
    └── routeTree.gen.ts            # Généré ; ne jamais modifier à la main
```

Le groupe authentifié contient actuellement le tableau de bord, les produits et leur détail, les emplacements et leur détail, l'inventaire, les clients, les fournisseurs, les commandes, les mouvements de stock, le journal d'audit, les utilisateurs, les rôles et les paramètres. Il n'existe pas de route `/stock` ni `/categories` ; la gestion des catégories fait partie de la page des produits.

## Architecture du rendu et des requêtes

`getRouter()` crée le routeur et son `QueryClient`. L'état des requêtes est déshydraté sur le serveur puis hydraté dans le navigateur : les loaders de route et les composants partagent donc le même cache. Le comportement par défaut comprend une durée de fraîcheur de 60 secondes, le préchargement à l'intention, la restauration du défilement et l'absence de nouvelle tentative pour les réponses 4xx.

`src/routes/__root.tsx` possède le document HTML et les providers globaux : branding, localisation, thème, info-bulles, notifications, outils de développement et enregistrement du service worker en production. Dans `beforeLoad`, `src/routes/_authed.tsx` choisit une branche selon l'hôte d'origine : la branche locataire résout l'utilisateur courant avant d'afficher son shell, tandis que la branche plateforme affiche l'accueil de la plateforme.

Le client API métier fonctionne de deux manières :

- Dans le navigateur, les requêtes utilisent `/api/v1` sur la même origine et incluent les identifiants.
- Pendant le SSR, elles utilisent `INTERNAL_API_ORIGIN` et transmettent le cookie, l'hôte et le protocole d'origine afin que le backend puisse résoudre le locataire.

Les formulaires d'authentification utilisent le client Better Auth du navigateur sur `/api/auth` ; l'autorisation des routes provient du profil `/api/v1/auth/me` chargé côté serveur. `better-auth` est verrouillé sur une version exacte et doit être mis à niveau délibérément.

N'autorisez `x-forwarded-host` et `x-forwarded-proto` que lorsque `TRUSTED_PROXY=1` et que le processus SSR se trouve derrière un proxy de confiance qui définit ces en-têtes. `VITE_CSP_NONCE` est facultatif et transmis à la configuration SSR du routeur.

Le premier rendu s'exécutant sur le serveur, ne lisez pas `window`, `document`, `navigator`, `localStorage` ni les API de caméra au niveau du module. Utilisez un gestionnaire d'événement, `useEffect` ou une condition explicite `typeof window !== 'undefined'`.

## Routage

TanStack Router déduit les chemins à partir des fichiers, y compris les groupes sans segment d'URL. Une route authentifiée doit donc déclarer son identifiant généré complet :

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { Resource } from '@stocket/types/auth'
import { z } from 'zod'
import { getListCategoriesQueryOptions } from '@/lib/data/categories'
import { requireRouteAccess } from '@/lib/router/guards'
import { pageSearchParam, stringSearchParam } from '@/lib/router/search'

const searchSchema = z.object({
  q: stringSearchParam,
  page: pageSearchParam,
})

export const Route = createFileRoute('/_authed/products')({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: ({ context }) => {
    requireRouteAccess(context.currentUser, Resource.PRODUCTS)
  },
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(getListCategoriesQueryOptions())
  },
  component: ProductsPage,
})
```

Conservez les filtres partageables et la pagination dans des paramètres de recherche URL validés. Utilisez les loaders pour précharger les requêtes nécessaires au premier rendu, puis consommez les mêmes options de requête ou hooks dans le composant. `routeTree.gen.ts` est produit par le plugin TanStack Router et ne doit pas être modifié manuellement.

### Protections d'hôte, de permission et de fonctionnalité

La route parente `_authed` gère la détection de l'hôte plateforme et l'authentification. Les routes enfants ajoutent les contrôles de ressource et de fonctionnalité avec `requireRouteAccess` :

```typescript
import { Resource } from '@stocket/types/auth'
import { FeatureKey } from '@stocket/types/features'
import { requireRouteAccess } from '@/lib/router/guards'

beforeLoad: ({ context }) => {
  requireRouteAccess(context.currentUser, Resource.ORDERS, {
    feature: FeatureKey.ORDERS,
  })
}
```

Utilisez le profil utilisateur déjà présent dans le contexte de route ; ne rechargez pas les permissions dans `beforeLoad`. Une route autonome réservée à la plateforme utilise `getServerIsPlatformHost()` et redirige les hôtes locataires.

Dans les composants, protégez séparément les actions d'écriture, car les permissions de lecture et d'écriture diffèrent :

```typescript
import { Permission, Resource } from '@stocket/types/auth'
import { FeatureKey } from '@stocket/types/features'
import { useFeatures } from '@/lib/features'
import { usePermissions } from '@/lib/permissions'

const { can } = usePermissions()
const features = useFeatures()
const canCreate = can(Permission.WRITE, Resource.PRODUCTS)
const canImport = canCreate && features.has(FeatureKey.SMART_IMPORT)
```

Les protections de route constituent la frontière de navigation du frontend ; les endpoints backend restent l'autorité de sécurité. Masquer la navigation ou les boutons est une protection UX supplémentaire, pas une autorisation. Lors de l'ajout d'une page, alignez sa protection de route avec les métadonnées `resource`/`feature` de la barre latérale.

## Conventions API et Query

Utilisez `@/` pour les imports depuis `src`. Bien que la configuration TypeScript résolve encore `~/`, le nouveau code suit la convention `@/`. Importez les DTO et enums depuis leur point d'entrée métier, par exemple `@stocket/types/products` ou `@stocket/types/auth`.

Les hooks API typés se trouvent dans `src/lib/data`. Les ressources standard utilisent `makeCrudHooks` ; les opérations spécifiques utilisent `makeQueryHook`, `makeParamQueryHook` ou `makeMutationHook`. Les utilitaires Axios ajoutent les en-têtes transmis pendant le SSR, extraient les données de réponse, acceptent un signal d'annulation pour les requêtes GET et redirigent les réponses 401 du navigateur vers `/login`.

```typescript
import { useListProducts } from '@/lib/data/products'

const products = useListProducts(
  { search: searchText || undefined, page, limit: 20 },
  { query: { enabled: isReady } },
)

if (products.isLoading) return <LoadingState />
if (products.error) return <ErrorState error={products.error} />
if (!products.data?.data.length) return <EmptyState />
```

Les options propres aux requêtes sont imbriquées sous `query`. Les callbacks de mutation sont imbriqués sous `mutation`, et les mutations CRUD générées reçoivent des variables de forme `{ data }`, `{ id, data }` ou `{ id }` :

```typescript
import { useQueryClient } from '@tanstack/react-query'
import {
  getListProductsQueryKey,
  useCreateProduct,
} from '@/lib/data/products'

const queryClient = useQueryClient()
const createProduct = useCreateProduct({
  mutation: {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getListProductsQueryKey(),
      })
    },
  },
})

createProduct.mutate({ data: values })
```

Préférez les factories d'options de requête exportées dans les loaders et les clés de requête exportées pour une invalidation ciblée. Préservez l'`AbortSignal` lors de l'ajout d'opérations GET.

## Formulaires et internationalisation

Les formulaires métier utilisent TanStack Form et Zod, généralement via un hook dans `src/hooks/forms`. Conservez la conversion des DTO et l'orchestration des mutations dans le hook ou la couche fonctionnelle, plutôt que dans les composants UI de base. La validation serveur reste l'autorité ; mappez les erreurs API vers une bannière de formulaire ou des erreurs de champ.

Toute chaîne visible par l'utilisateur nécessite des clés correspondantes dans `src/locales/en`, `de` et `fr`. Utilisez `useTranslation()` dans les composants et séparez les valeurs stables d'enum/statut de leurs libellés traduits.

Nettoyez les URL fournies par l'API avec `sanitizeUrl()` depuis `@/lib/utils`. Validez les URL saisies par l'utilisateur avec le schéma d'URL sûre partagé avant de les stocker.

## Styles et composants

Utilisez les couches de style existantes selon leur rôle :

- StyleX (`stylex.create` et `stylex.props`) pour les mises en page fonctionnelles et les styles locaux.
- Les primitives StyleX partagées de `@/lib/stylex` pour les motifs de mise en page répétés.
- Les composants shadcn/Radix de `@/components/ui` pour les contrôles et superpositions accessibles.
- Les utilitaires Tailwind et `cn()` lorsqu'un composant shadcn expose `className` ou qu'une petite composition d'utilitaires est plus claire.
- Les propriétés CSS personnalisées de `routes/globals.css` pour les couleurs, la sémantique d'espacement et les valeurs dépendantes du thème.

```typescript
import * as stylex from '@stylexjs/stylex'
import { Button } from '@/components/ui/button'
import { stylexBase } from '@/lib/stylex/base'

const styles = stylex.create({
  actions: {
    alignItems: 'center',
    display: 'flex',
    gap: '0.75rem',
  },
})

<div {...stylex.props(stylexBase.panelColumn, styles.actions)}>
  <Button type="button">{t('common.save')}</Button>
</div>
```

Ne codez pas en dur les couleurs du thème clair. Le document peut utiliser les thèmes Stocket clair, Stocket sombre, neutre clair ou neutre sombre ; tous sont résolus par les variables CSS.

## Tâches en arrière-plan et Smart Import

L'import de produits est une requête multipart qui met en file une tâche backend durable. `importProductsCsv` exige une clé d'idempotence, puis `waitForTask` interroge `/tasks/:id` chaque seconde jusqu'à `SUCCEEDED`, `FAILED` ou `CANCELED`. Le délai d'attente côté navigateur est de 30 minutes ; les erreurs réseau et certaines erreurs HTTP réessayables n'abandonnent pas immédiatement la tâche.

```typescript
import type { TaskResponseDto } from '@stocket/types/tasks'
import { useState } from 'react'
import { useBulkCsvImport } from '@/hooks/products'

const [task, setTask] = useState<TaskResponseDto | null>(null)
const importProducts = useBulkCsvImport(handleResult, handleFailure)

importProducts.mutate({
  file,
  approvedPlan,
  idempotencyKey,
  onTaskUpdate: setTask,
})
```

Gardez l'identifiant et la progression de la tâche visibles afin que l'utilisateur puisse vérifier son état après un délai d'attente du navigateur. Réutilisez la même clé d'idempotence pour réessayer la même soumission. Ne lancez pas plusieurs boucles d'interrogation en parallèle : chaque requête dépend de l'état précédent. L'interface Smart Import doit rester protégée à la fois par `PRODUCTS.WRITE` et `FeatureKey.SMART_IMPORT`.

## Limites de la PWA

La racine de production enregistre `public/sw.js` ; ce n'est pas le cas en développement. Le manifeste démarre l'application installée sur `/login?source=pwa`. Le service worker précharge la page hors ligne et les ressources de marque, utilise une stratégie réseau d'abord pour la navigation avec repli hors ligne, et une stratégie stale-while-revalidate pour les ressources statiques.

Les requêtes API sont explicitement exclues du cache du service worker. L'application ne fournit ni données hors ligne, ni mutations en attente, ni synchronisation en arrière-plan. Les fonctionnalités doivent considérer l'accès API comme disponible uniquement en ligne et afficher les erreurs réseau normales en cas de déconnexion.

## Tests et vérifications

Les tests unitaires et de composants sont colocalisés sous `src/**/*.test.ts(x)` et s'exécutent dans l'environnement JSDOM de Vitest avec Testing Library et le plugin de test StyleX. Placez les comportements purs de requête, protection, reducer et tâche dans des tests unitaires ciblés ; testez le comportement visible des composants avec des rôles et libellés accessibles.

Les spécifications Playwright se trouvent dans `e2e/tests`. Le projet de préparation crée l'état de stockage authentifié pour les tests locataires ; les tests d'authentification utilisent le projet non authentifié. L'origine cible provient de `E2E_FRONTEND_ORIGIN`.

Depuis `frontend/`, utilisez :

```bash
pnpm type-check
pnpm lint
pnpm format:check
pnpm test:unit
pnpm test:e2e
pnpm validate       # type-check + lint + format:check
```

Exécutez le plus petit test unitaire ou E2E pertinent pendant l'itération, puis `pnpm validate` avant la livraison.

## Ajouter une page fonctionnelle

1. Ajoutez la route sous `src/routes/_authed` et utilisez son identifiant généré complet.
2. Définissez et validez les paramètres de recherche URL lorsque l'état doit être partageable.
3. Ajoutez les contrôles de ressource et, si nécessaire, de fonctionnalité avec `requireRouteAccess`.
4. Préchargez l'état serveur initial avec les options de requête exportées lorsque cela améliore le SSR.
5. Placez les opérations API dans `src/lib/data` et l'orchestration dans un hook ou composant fonctionnel.
6. Protégez les contrôles d'écriture avec `usePermissions` et les droits de plan avec `useFeatures`.
7. Ajoutez les métadonnées correspondantes dans la barre latérale et les traductions en anglais, allemand et français.
8. Ajoutez une couverture unitaire/composant ciblée et le scénario Playwright pertinent.

## Erreurs courantes

- Déclarer une route authentifiée comme `/products` au lieu de `/_authed/products`.
- Modifier `routeTree.gen.ts` manuellement.
- Ajouter des imports `~/` au lieu de l'alias standard du projet `@/`.
- Passer directement `{ enabled }` au lieu de `{ query: { enabled } }` aux hooks de données.
- Passer directement un DTO à une mutation générée au lieu de `{ data: dto }`.
- Lire les objets globaux du navigateur ou des variables réservées au navigateur pendant le SSR.
- Transmettre les en-têtes proxy sans respecter la frontière de proxy de confiance.
- Masquer un lien sans appliquer les mêmes permission et fonctionnalité sur la route.
- Supposer que la PWA met les données API en cache ou qu'un délai d'attente navigateur a annulé une tâche backend.
