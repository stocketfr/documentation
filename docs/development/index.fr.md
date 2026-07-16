# Développement

Cette section couvre tout ce dont vous avez besoin pour contribuer à la base de code Stocket Inventory.

## Aperçu

Stocket Inventory est un workspace multi-repo contenant :

- **backend/** - Backend Effect.ts (runtime Bun)
- **frontend/** - Frontend TanStack Start
- **packages/** - Types partagés, configs
- **meta/** - Scripts d'orchestration, Docker Compose

## Liens Rapides

- [Architecture](architecture.md) - Conception du système et stack technique
- [Architecture IA et MCP](mcp-api.md) - capacités IA typées, confirmation,
  changements durables, annulation et frontières d'accès distant
- [Configuration](setup.md) - Configuration de l'environnement de développement
- [Style de Code](code-style.md) - ESLint, Prettier et conventions
- [Tests](testing.md) - Patterns de tests Vitest
- [Développement API](api-development.md) - Patterns Effect.ts
- [Développement Frontend](frontend-development.md) - Patterns TanStack Start
- [CI/CD](ci-cd.md) - Workflows GitHub Actions

## Flux de Travail de Développement

1. **Démarrer l'environnement**

    ```bash
    # Démarrer les services (PostgreSQL, etc.)
    cd meta && docker compose up -d

    # Entrer dans le shell de développement (Nix flakes par repo)
    cd backend && nix develop
    cd frontend && nix develop
    ```

2. **Effectuer les modifications** dans la base de code

3. **Mettre à jour les types partagés** (si les DTO ont changé)

    ```bash
    pnpm --filter @stocket/types build
    ```

4. **Exécuter les tests et le lint**

    ```bash
    pnpm test
    pnpm lint
    ```

5. **Soumettre une pull request**
