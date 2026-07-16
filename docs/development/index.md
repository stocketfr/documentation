# Development

This section covers everything you need to contribute to the Stocket Inventory codebase.

## Overview

Stocket Inventory is a **pnpm monorepo** containing:

- **backend/** — Effect.ts backend (Bun runtime, `@stocket/api`)
- **frontend/** — TanStack Start SSR app (`@stocket/web`)
- **mobile-app/** — Expo React Native app (`@stocket/mobile`)
- **landing/** — Static marketing site
- **remote-desktop/** — Tauri 2 desktop app (`@stocket/remote-desktop`)
- **packages/** — Shared `types`, `eslint-config`, `tsconfig`
- **meta/** — Workspace tooling: Docker Compose, legacy multi-repo scripts
- **infrastructure/** — Terraform (Hetzner + Cloudflare); not a pnpm workspace member

## Quick Links

- [Architecture](architecture.md) — System design and tech stack
- [AI and MCP Architecture](mcp-api.md) — typed AI capabilities, confirmation,
  durable changes, undo, and remote-access boundaries
- [Setup](setup.md) — Development environment configuration
- [Code Style](code-style.md) — oxlint, Prettier, and conventions
- [Testing](testing.md) — Vitest + Playwright patterns
- [API Development](api-development.md) — Effect.ts patterns
- [Frontend Development](frontend-development.md) — TanStack Start patterns
- [CI/CD](ci-cd.md) — GitHub Actions workflows

## Development Workflow

1. **Install once from the monorepo root**

    ```bash
    pnpm install
    ```

2. **Start services**

    ```bash
    cd meta && docker compose up -d
    ```

3. **Run dev servers (separate terminals)**

    ```bash
    pnpm --filter @stocket/api start
    pnpm --filter @stocket/web dev
    ```

    Per-package Nix shells (`cd backend && nix develop`) are optional for isolated environments; there is **no root flake.nix**.

4. **Make changes** to the codebase

5. **Update shared types** (if DTO shapes changed) — **barrels must run before build**

    ```bash
    pnpm --filter @stocket/types barrels
    pnpm --filter @stocket/types build
    ```

6. **Run tests and lint**

    ```bash
    pnpm --filter @stocket/api test
    pnpm --filter @stocket/api lint      # oxlint
    pnpm --filter @stocket/web lint      # oxlint (frontend too)
    ```

7. **Submit a pull request**
