# Référence

Cette section rassemble les réglages d'exécution, les commandes des dépôts et les diagnostics rapides.

## Référence d'exécution

- [Variables d'environnement](environment-variables.md) décrit les réglages du backend, du worker, du web, du stockage et des tests.
- [Commandes CLI](cli-commands.md) répertorie les commandes par dépôt. Exécutez-les depuis le dépôt indiqué sauf mention contraire.
- [Dépannage](troubleshooting.md) couvre les problèmes les plus courants de l'espace de travail local.

## API et contrats

Les routes applicatives sont sous `/api/v1`, préfixe qui comprend surfaces tenant, plateforme/superadmin, opérationnelles et de test hors production. Better Auth est sous `/api/auth`. Swagger UI sur `/docs` ne décrit actuellement que la santé. Les routeurs montés sont la vérité runtime et leurs schémas `@stocketfr/types` correspondants définissent les payloads. Tout schéma exporté n'est pas monté : fulfillment reste par exemple un prototype.

Les applications installent les paquets publiés depuis GitHub Packages :

```json
{
  "dependencies": {
    "@stocket/types": "npm:@stocketfr/types@1.8.0"
  }
}
```

`@stocket/types` est l'alias côté consommateur. Dans le dépôt packages, les commandes utilisent le nom publié, par exemple `pnpm --filter @stocketfr/types build`.

Pour les responsabilités et frontières d'exécution de chaque dépôt et module, consultez la [carte des projets et modules](../development/project-map.md).
