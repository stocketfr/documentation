# Tests

Les tests appartiennent au dépôt propriétaire du comportement. Préférez le test déterministe le plus étroit, puis une intégration ou un navigateur lorsque la frontière fait partie du besoin.

## Suites backend

Le backend utilise Vitest sur Node :

| Motif | Rôle | `pnpm test` par défaut |
| --- | --- | --- |
| `*.spec.ts` | Tests purs/unitaires/services/routeurs | Oui |
| `*.effect.spec.ts` | Services/couches Effect | Oui |
| `*.property.spec.ts` | Propriétés Fast-check | Oui |
| `*.integration.spec.ts` | Intégration PostgreSQL réelle | Non ; `pnpm test:integration` |

Les références internes sont `backend/TESTING.md` et `backend/src/effect/testing/README.md`.

Utilisez `@effect/vitest`/`it.effect` et remplacez uniquement la frontière testée dans les layers. Testez les schémas publiés avec des références réalistes : un produit de test exige une catégorie. Vérifiez les erreurs métier taguées plutôt qu'un texte d'exception incident.

### Intégration PostgreSQL

```bash
cd backend
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stocket_inventory_test \
  pnpm test:integration
```

La configuration migre une fois, exécute en série et tronque entre tests. Ne ciblez jamais une base de développement/production. Couvrez isolation tenant, contraintes, transactions, concurrence, contrats de mutation et requêtes dupliquées/idempotentes lorsque la persistance compte.

L'audit est lancé en daemon au mieux. Un test qui attend une ligne utilise le polling `waitForAuditLog` existant ; un délai fixe ou une assertion immédiate est instable et ne doit pas laisser croire à une garantie transactionnelle.

### Commandes backend

```bash
pnpm test
pnpm test:watch
pnpm test:cov
pnpm test:integration
pnpm test:mutation:pure
pnpm test:duplicates
```

Le smoke test MinIO optionnel ne s'exécute que si MinIO est disponible et si
`RUN_MINIO_STORAGE_SMOKE=true` est défini explicitement.

## Tests unitaires frontend

Vitest exécute `src/**/*.test.ts` et `src/**/*.test.tsx` dans jsdom.

```bash
cd frontend
pnpm test:unit
pnpm test:unit:watch
```

Testez via noms accessibles et état visible. Entourez les composants des mêmes providers query/router/i18n que les tests voisins. Pour les hooks de données, vérifiez clés générées, `enabled`, invalidation et variables de mutation `{ data }` sans traverser les détails internes.

Incluez permissions et fonctionnalités des routes protégées. Les helpers sensibles au SSR couvrent hôte, cookie et protocole forwarded sans supposer `window`.

## Playwright full-stack

```bash
cd frontend
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
```

La CI construit les deux applications et exécute Chromium avec une révision backend épinglée, PostgreSQL 16 et LocalStack S3. Le setup global provisionne tenant/compte via le seed protégé. L'authentification est un projet Playwright séparé ; la plupart des tests réutilisent son état, les specs d'auth restent indépendantes.

Ajoutez un E2E pour un comportement critique inter-frontières : récupération de compte, résolution hôte/tenant, permissions/fonctionnalités, tâche d'import, stockage ou interaction navigateur/serveur. Les données de seed doivent être explicites et répétables.

Pour une évolution conjointe frontend/backend, mettez `BACKEND_REF` à jour après validation de la paire. Un test vert contre un backend ancien compatible ne prouve pas la paire non publiée.

## Paquets, desktop, docs et infrastructure

- `packages` : `pnpm build`, tests tels que `pnpm --filter @stocketfr/emails test`, puis contrôle des barrels générés.
- `remote-desktop` : `pnpm test` et `pnpm lint` ; la publication reste expérimentale.
- `documentation` : validez liens/navigation et laissez la PR exécuter `mkdocs build --strict`.
- `infrastructure` : format/validation Terraform, tests destroy-guard, syntaxe Ansible et rendu compose dans le workflow protégé.

## Avant une pull request

Exécutez d'abord les contrôles ciblés, puis type/lint du dépôt propriétaire. Signalez précisément tout contrôle ignoré. Une inspection visuelle ne remplace pas un test manquant.
