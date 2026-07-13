# Processus de pull request

Les pull requests sont propres à chaque dépôt. Ouvrez la pull request dans le dépôt responsable du changement, même si vous l'avez développé depuis le workspace local combiné.

## Avant d'ouvrir une pull request

Vérifiez que :

- La branche contient un seul changement cohérent, sans fichiers générés du workspace ni modifications sans rapport.
- Les tests, le lint, la vérification des types et les builds pertinents ont été exécutés comme indiqué dans les [directives de contribution](guidelines.md).
- Le nouveau comportement dispose de tests ciblés, ou la description explique pourquoi un test automatique n'est pas réalisable.
- Les documentations utilisateur, développeur, opérations et référence ont été mises à jour si nécessaire.
- Les versions anglaises et françaises de la documentation restent synchronisées.
- Aucun identifiant, token, donnée de production, fichier d'environnement local ou log sensible n'est présent.
- La branche repose sur une version suffisamment récente de `main` pour que le résultat CI soit pertinent.

N'exécutez pas systématiquement toutes les vérifications de tous les projets. Exécutez localement le plus petit ensemble pertinent et laissez la CI du dépôt cible appliquer la validation complète du dépôt.

## Changements multi-dépôts

Un checkout du workspace ne transforme pas les projets en un dépôt unique. Lorsqu'un changement touche plusieurs dépôts :

1. Ouvrez une pull request séparée dans chaque dépôt concerné.
2. Liez toutes les pull requests associées dans chaque description.
3. Indiquez les dépendances et l'ordre de merge.
4. Préservez autant que possible la compatibilité pendant la transition.
5. Pour un changement publiable d'un package `@stocketfr/*`, ajoutez un Changeset et utilisez si nécessaire la version snapshot publiée par la pull request du package pour tester les pull requests consommatrices.
6. Mettez à jour cette documentation avec le comportement public qui existera une fois l'ensemble mergé.

Ne présentez pas une pull request associée comme déployée simplement parce qu'elle a été mergée. L'automatisation des releases et déploiements varie selon le dépôt.

## Description de la pull request

Utilisez une description qui donne aux reviewers assez d'éléments pour évaluer le résultat :

```markdown
## Résumé

Décrivez le résultat utilisateur ou opérationnel et la raison du changement.

## Changements

- Décrivez les modifications d'implémentation importantes.
- Signalez les migrations, décisions de compatibilité ou comportements sensibles pour la sécurité.

## Travaux liés

- Closes #123
- Depends on stocketfr/packages#456
- Companion documentation: stocketfr/documentation#789

## Vérification

- `commande exécutée` — réussie
- Scénario manuel — résultat
- Non exécuté : vérification et raison

## Documentation

- [ ] Documentation utilisateur/développeur/référence mise à jour
- [ ] Versions anglaises et françaises synchronisées
- [ ] Aucun changement documentaire requis, avec justification

## Captures d'écran

Ajoutez des captures avant/après ou un court enregistrement pour les changements visuels.
```

Supprimez les sections qui ne s'appliquent réellement pas, mais conservez toujours un résumé concret et les preuves de vérification.

## Vérifications automatiques

Les vérifications sont définies par dépôt dans l'architecture actuelle :

| Dépôt | Vérifications des pull requests |
| --- | --- |
| `backend` | Audit des dépendances, lint, vérification des types, tests unitaires, tests d'intégration PostgreSQL, build Node 22 |
| `frontend` | Audit des dépendances, lint, formatage, vérification des types, tests unitaires, build de production, tests Playwright full-stack avec PostgreSQL et stockage compatible S3 |
| `packages` | Build des packages ; les changements publiables peuvent aussi produire des snapshots immuables de PR |
| `documentation` | `node scripts/audit-docs.mjs` pour parité/liens/nav, puis `mkdocs build --strict` pour les deux langues |
| `infrastructure` | Tests du garde-fou de destruction, formatage/validation/plan Terraform, vérifications Ansible et des services rendus |
| `remote-desktop` | Lint de l'interface et tests unitaires |

Les dépôts `meta` et `landing` n'ont actuellement aucun workflow local de pull request. Leur description doit donc préciser les vérifications manuelles effectuées.

Les pull requests backend et frontend valident les artefacts applicatifs sans les publier ni les déployer. Le chemin ponctuel de juillet 2026 était un dispatch manuel séparé, limité au `main` courant après réussite de sa CI push. L'application de l'infrastructure est aussi une action manuelle protégée et séparée ; un plan réussi ne modifie pas la production.

Toutes les vérifications requises du dépôt cible doivent réussir avant le merge. Si une vérification échoue pour une raison sans rapport avec la pull request, documentez les preuves au lieu de relancer aveuglément ou d'affaiblir la vérification.

## Review

Les reviewers évaluent :

- La correction et la clarté de l'implémentation.
- L'isolation des tenants, l'autorisation, la gestion des secrets et les autres frontières de sécurité.
- La compatibilité des contrats partagés et des dépendances multi-dépôts.
- La qualité des tests et les comportements d'échec.
- L'expérience utilisateur, l'accessibilité, le SSR et les implications offline pour le frontend.
- La sécurité opérationnelle, les possibilités de rollback/récupération et l'observabilité pour l'infrastructure ou les traitements en arrière-plan.
- L'exactitude et la parité linguistique de la documentation.

Répondez à chaque fil de discussion actionnable. Poussez des commits de suivi ciblés, expliquez les désaccords avec des éléments techniques et demandez une nouvelle review lorsque les échanges et les vérifications sont à jour.

## Mettre à jour la branche

Si la branche cible a évolué et que la pull request ne peut plus être mergée ou que son résultat est obsolète, mettez votre branche à jour selon le workflow accepté par le dépôt. Pour une branche de fonctionnalité privée, un rebase peut être effectué avec :

```sh
git fetch origin
git rebase origin/main
git push --force-with-lease
```

Ne force-pushez jamais une branche partagée sans coordination avec ses autres contributeurs. Résolvez les conflits dans le dépôt responsable et réexécutez les vérifications affectées.

## Frontières de merge et de release

Les mainteneurs mergent après la review et la réussite des vérifications requises. Le merge n'a pas le même effet dans chaque dépôt :

- `documentation` : un push sur `main` exécute le workflow de déploiement GitHub Pages.
- `packages` : Changesets met à jour ou crée une pull request de release ; le merge de cette pull request de versions publie les packages stables et les releases GitHub.
- `infrastructure` : l'application en production requiert une option explicite du workflow et un environnement protégé ; le merge d'un plan ne l'applique pas.
- `remote-desktop` : le packaging est géré par un workflow de release séparé déclenché par tag ou dispatch, et non par la CI normale.
- `backend` et `frontend` : le merge ne publie ni ne déploie automatiquement.
  Un workflow ponctuel temporaire, lorsqu'il existe pour un rollout audité,
  exige encore un dispatch explicite et n'accepte que le `main` courant après
  une CI réussie.

Lorsqu'un rollout, une migration, une publication de package ou une vérification manuelle reste à effectuer, gardez l'issue associée ouverte jusqu'à la fin de ce travail.

## Après le merge

- Supprimez la branche de fonctionnalité lorsqu'elle n'est plus nécessaire.
- Vérifiez que les issues liées et les pull requests associées reflètent le travail réellement restant.
- Pour la documentation, vérifiez le workflow Pages et la navigation publiée.
- Pour les packages, suivez la pull request de release Changesets jusqu'aux mises à jour des consommateurs.
- Créez une issue pour tout nettoyage ou suivi opérationnel différé au lieu de le laisser uniquement dans une discussion mergée.
