# Contribution Guidelines

Stocket is a multi-repository project. A contribution should be made and reviewed in the repository that owns the behavior being changed.

## Choose the owning repository

| Area | Repository |
| --- | --- |
| Effect API, database, background tasks | `backend` |
| TanStack Start web application and PWA | `frontend` |
| Shared contracts, email templates, TypeScript and lint configuration | `packages` |
| Workspace bootstrap and local service orchestration | `meta` |
| Terraform, Ansible, Caddy, backups and production operations | `infrastructure` |
| Tauri desktop client | `remote-desktop` |
| Public documentation | `documentation` |
| Marketing site | `landing` |

If a change spans repositories, keep each repository's change independently reviewable and connect the pull requests with links and an explicit merge order.

## Set up a checkout

For a documentation-only contribution, clone this repository directly:

```sh
git clone git@github.com:stocketfr/documentation.git
cd documentation
```

For product work, use the workspace control plane:

```sh
mkdir stocketfr
cd stocketfr
git clone git@github.com:stocketfr/meta.git
cd meta
./scripts/bootstrap
cd ..
```

Bootstrap clones the repositories declared in `meta/repos.yaml`, creates the local workspace overlay, and installs JavaScript dependencies. Infrastructure is operated as a separate repository and must be cloned separately when it is part of the change.

Each child directory remains an independent repository. Create commits and pull requests from the target repository, not from the generated workspace root.

## Create a focused branch

Create a branch from the current `main` branch of the target repository:

```sh
git switch main
git pull --ff-only
git switch -c feat/short-description
```

Use a `fix/`, `docs/`, `refactor/`, or similarly descriptive prefix when it better represents the work. Contributors using another compatible version-control client can follow the equivalent workflow.

## Make the change

- Follow the relevant [code style guide](../development/code-style.md).
- Keep the change scoped to one coherent outcome.
- Add or update tests for behavior changes.
- Update user, developer, operations, and reference documentation when their observable behavior changes.
- Do not commit credentials, generated build output, local environment files, or workspace symlinks.

### Backend conventions

- Use the current Effect layers, services, routers, and platform helpers under `backend/src/effect/`.
- Define public request and response contracts with shared Effect schemas from `@stocket/types`; the published source package is `@stocketfr/types`.
- Apply tenant context, permissions, feature entitlements, validation, and audited mutation helpers consistently.
- Run long-running imports and other durable work through the persisted background-task system rather than an unmanaged request fiber.

See the [API development guide](../development/api-development.md) for the current patterns.

### Frontend conventions

- Preserve TanStack Start's server/client boundary and the same-origin `/api/v1` proxy.
- Use the `@/` source alias, TanStack Query data layer, and the existing route access and feature-gate helpers.
- Follow the established StyleX, Tailwind, and shadcn composition in the area being changed.
- Do not edit generated route-tree output manually.
- Consider SSR, tenant and platform hosts, loading/error states, accessibility, and offline/PWA behavior.

See the [frontend development guide](../development/frontend-development.md) for details.

### Shared package conventions

- Package names use the `@stocketfr/*` publishing scope.
- Add a Changeset for every publishable package change.
- Build regenerated type barrels before committing them when shared contracts change.
- Coordinate consumer changes with the immutable snapshot version published by the package pull request when necessary.

### Documentation conventions

- English pages use `name.md`; French counterparts use `name.fr.md`.
- Keep both locales structurally and factually synchronized.
- Verify commands, paths, routes, environment variables, and workflow claims against current source files.
- Use relative links for pages within this site and update `mkdocs.yml` when adding or moving a page.

## Verify the change

Run the smallest checks that cover the changed behavior. Common checks include:

### Backend, from the workspace root

```sh
pnpm --filter @stocket/api type-check
pnpm --filter @stocket/api lint
pnpm --filter @stocket/api test
pnpm --filter @stocket/api build
```

Run `test:integration` as well when database or HTTP behavior changes.

### Frontend, from the workspace root

```sh
pnpm --filter @stocket/web validate
pnpm --filter @stocket/web test:unit
pnpm --filter @stocket/web build
```

Run the relevant Playwright tests when a user flow, route, authentication, tenancy, or server-proxy behavior changes.

### Shared packages, from `packages/`

```sh
pnpm build
pnpm --filter @stocketfr/emails test
```

### Documentation, from `documentation/`

```sh
node scripts/audit-docs.mjs
mkdocs build --strict
```

### Infrastructure, from `infrastructure/`

```sh
terraform fmt -check -recursive
bash tests/production-destroy-guard.spec.sh
```

Infrastructure CI performs additional Terraform planning, Ansible syntax, backup, deploy-helper, Caddy, and rendered Compose checks.

### Remote desktop, from `remote-desktop/`

```sh
pnpm lint
pnpm test
```

If a required check needs unavailable credentials or external infrastructure, state exactly what was not run and provide the strongest local evidence available.

## Commit and push

Use a clear, imperative commit message. Conventional Commit prefixes make repository history easier to scan:

```sh
git commit -m "feat: add product search"
git commit -m "fix: preserve tenant host during sign-in"
git commit -m "docs: refresh workspace setup"
```

Push the branch and open a pull request in the same repository:

```sh
git push --set-upstream origin feat/short-description
```

Then follow the [pull-request process](pull-requests.md).

## Review standards

Reviewers should be able to determine:

1. What user or operational outcome changes.
2. Why this repository owns the change.
3. How the implementation respects tenancy, permissions, security, and compatibility.
4. Which automated and manual checks were run.
5. Which documentation or companion pull requests complete the change.

Keep discussion technical and concrete. Resolve or explicitly answer review threads before requesting another review.

## Getting help

- Read the relevant development and reference guides.
- Search issues and pull requests in the owning repository.
- Ask a focused question in the issue or pull request, including the evidence already collected.
