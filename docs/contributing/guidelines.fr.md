# Directives de contribution

Stocket est un projet composé de plusieurs dépôts. Une contribution doit être réalisée et revue dans le dépôt responsable du comportement modifié.

## Choisir le dépôt responsable

| Domaine | Dépôt |
| --- | --- |
| API Effect, base de données, tâches en arrière-plan | `backend` |
| Application web TanStack Start et PWA | `frontend` |
| Contrats partagés, modèles d'e-mails, configuration TypeScript et lint | `packages` |
| Bootstrap du workspace et orchestration des services locaux | `meta` |
| Terraform, Ansible, Caddy, sauvegardes et opérations de production | `infrastructure` |
| Client desktop Tauri | `remote-desktop` |
| Documentation publique | `documentation` |
| Site marketing | `landing` |

Si un changement touche plusieurs dépôts, gardez chaque modification indépendante et facile à revoir, puis reliez les pull requests en indiquant explicitement leur ordre de merge.

## Configurer un checkout

Pour une contribution limitée à la documentation, clonez directement ce dépôt :

```sh
git clone git@github.com:stocketfr/documentation.git
cd documentation
```

Pour travailler sur le produit, utilisez le dépôt de contrôle du workspace :

```sh
mkdir stocketfr
cd stocketfr
git clone git@github.com:stocketfr/meta.git
cd meta
./scripts/bootstrap
cd ..
```

Le bootstrap clone les dépôts déclarés dans `meta/repos.yaml`, crée l'overlay du workspace local et installe les dépendances JavaScript. L'infrastructure est exploitée dans un dépôt séparé et doit être clonée séparément lorsqu'elle fait partie du changement.

Chaque répertoire enfant reste un dépôt indépendant. Créez les commits et pull requests depuis le dépôt cible, pas depuis la racine générée du workspace.

## Créer une branche ciblée

Créez une branche depuis la branche `main` à jour du dépôt cible :

```sh
git switch main
git pull --ff-only
git switch -c feat/description-courte
```

Utilisez un préfixe `fix/`, `docs/`, `refactor/` ou un autre préfixe descriptif lorsqu'il représente mieux le travail. Les personnes qui utilisent un autre client de gestion de versions compatible peuvent suivre le workflow équivalent.

## Réaliser le changement

- Suivez le [guide de style de code](../development/code-style.md) approprié.
- Limitez le changement à un résultat cohérent.
- Ajoutez ou mettez à jour les tests pour tout changement de comportement.
- Mettez à jour les documentations utilisateur, développeur, opérations et référence lorsque leur comportement observable évolue.
- Ne commitez pas d'identifiants, de sorties de build générées, de fichiers d'environnement locaux ou de liens symboliques du workspace.

### Conventions backend

- Utilisez les layers, services, routers et helpers de plateforme Effect actuels sous `backend/src/effect/`.
- Définissez les contrats publics de requête et de réponse avec les schémas Effect partagés de `@stocket/types` ; le package source publié est `@stocketfr/types`.
- Appliquez de manière cohérente le contexte tenant, les permissions, les droits liés aux fonctionnalités, la validation et les helpers de mutation auditée.
- Exécutez les imports longs et les autres travaux durables via le système persistant de tâches en arrière-plan, et non dans une fibre non gérée liée à la requête.

Consultez le [guide de développement API](../development/api-development.md) pour les patterns actuels.

### Conventions frontend

- Préservez la frontière serveur/client de TanStack Start et le proxy same-origin `/api/v1`.
- Utilisez l'alias source `@/`, la couche de données TanStack Query et les helpers existants de contrôle des routes et fonctionnalités.
- Respectez la composition StyleX, Tailwind et shadcn déjà utilisée dans la zone modifiée.
- Ne modifiez pas manuellement l'arbre de routes généré.
- Prenez en compte le SSR, les hôtes tenant et plateforme, les états de chargement et d'erreur, l'accessibilité et le comportement offline/PWA.

Consultez le [guide de développement frontend](../development/frontend-development.md) pour plus de détails.

### Conventions des packages partagés

- Les packages utilisent le scope de publication `@stocketfr/*`.
- Ajoutez un Changeset pour chaque modification de package publiable.
- Générez et buildez les barrels de types avant de les commiter lorsqu'un contrat partagé change.
- Si nécessaire, coordonnez les changements consommateurs avec la version snapshot immuable publiée par la pull request du package.

### Conventions de documentation

- Les pages anglaises utilisent `nom.md` ; leurs équivalents français utilisent `nom.fr.md`.
- Gardez les deux langues synchronisées dans leur structure et leurs informations.
- Vérifiez les commandes, chemins, routes, variables d'environnement et affirmations sur les workflows dans les sources actuelles.
- Utilisez des liens relatifs pour les pages de ce site et mettez à jour `mkdocs.yml` lors de l'ajout ou du déplacement d'une page.

## Vérifier le changement

Exécutez les vérifications les plus petites qui couvrent le comportement modifié. Les commandes fréquentes incluent :

### Backend, depuis la racine du workspace

```sh
pnpm --filter @stocket/api type-check
pnpm --filter @stocket/api lint
pnpm --filter @stocket/api test
pnpm --filter @stocket/api build
```

Exécutez également `test:integration` lorsque le comportement de la base de données ou HTTP change.

### Frontend, depuis la racine du workspace

```sh
pnpm --filter @stocket/web validate
pnpm --filter @stocket/web test:unit
pnpm --filter @stocket/web build
```

Exécutez les tests Playwright concernés lorsqu'un parcours utilisateur, une route, l'authentification, la gestion des tenants ou le proxy serveur change.

### Packages partagés, depuis `packages/`

```sh
pnpm build
pnpm --filter @stocketfr/emails test
```

### Documentation, depuis `documentation/`

```sh
node scripts/audit-docs.mjs
mkdocs build --strict
```

### Infrastructure, depuis `infrastructure/`

```sh
terraform fmt -check -recursive
bash tests/production-destroy-guard.spec.sh
```

La CI de l'infrastructure exécute des vérifications supplémentaires : plan Terraform, syntaxe Ansible, sauvegardes, helper de déploiement, Caddy et rendu de la configuration Compose.

### Client desktop, depuis `remote-desktop/`

```sh
pnpm lint
pnpm test
```

Si une vérification requise dépend d'identifiants indisponibles ou d'une infrastructure externe, indiquez précisément ce qui n'a pas été exécuté et fournissez la meilleure preuve locale disponible.

## Commiter et pousser

Utilisez un message de commit clair et à l'impératif. Les préfixes Conventional Commits facilitent la lecture de l'historique :

```sh
git commit -m "feat: add product search"
git commit -m "fix: preserve tenant host during sign-in"
git commit -m "docs: refresh workspace setup"
```

Poussez la branche et ouvrez une pull request dans le même dépôt :

```sh
git push --set-upstream origin feat/description-courte
```

Suivez ensuite le [processus de pull request](pull-requests.md).

## Critères de review

Les reviewers doivent pouvoir déterminer :

1. Quel résultat utilisateur ou opérationnel évolue.
2. Pourquoi ce dépôt est responsable du changement.
3. Comment l'implémentation respecte la gestion des tenants, les permissions, la sécurité et la compatibilité.
4. Quelles vérifications automatiques et manuelles ont été exécutées.
5. Quelles documentations ou pull requests associées complètent le changement.

Gardez les échanges techniques et concrets. Résolvez ou répondez explicitement aux fils de review avant de demander une nouvelle review.

## Obtenir de l'aide

- Lisez les guides de développement et de référence concernés.
- Recherchez dans les issues et pull requests du dépôt responsable.
- Posez une question précise dans l'issue ou la pull request, en incluant les éléments déjà recueillis.
