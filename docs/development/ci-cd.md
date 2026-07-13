# CI, Releases, and Deployment

Stocket repositories are independent delivery units. There is no single
monorepo pipeline, and not every validated artifact is currently deployed.

## Workflow and Release Inventory

| Repository | Trigger | Current jobs or outcome |
|------------|---------|-------------------------|
| `backend` | pull requests and pushes to `main` | production dependency audit, Oxlint, TypeScript, Vitest unit tests, PostgreSQL integration tests, and Node 22/esbuild build |
| `frontend` | pull requests and pushes to `main` | production dependency audit, Oxlint, Prettier check, TypeScript, Vitest, build, and full-stack Playwright with a pinned backend revision, PostgreSQL, and LocalStack S3 |
| backend/frontend rollout (temporary, July 2026) | explicit manual dispatch | current-`main`/successful-CI guard, SHA images, and `stocket-deploy`; removed after the one-time rollout |
| `packages` | pull requests and pushes to `main` | package build; pull-request snapshot publication; Changesets version PR and stable publication to GitHub Packages |
| `documentation` | pull requests | EN/FR, navigation, and relative-link audit, then `mkdocs build --strict` |
| `documentation` | pushes to `main` | repeat the audit, then deploy MkDocs to the `gh-pages` branch |
| `infrastructure` | pull requests | destroy-guard tests, Terraform formatting/init/validate/plan, Ansible syntax, Caddy/deploy/backup tests, and rendered Compose validation |
| `infrastructure` | protected manual dispatch | optional Terraform apply, Ansible configuration, and verification |
| `remote-desktop` | tags/manual dispatch/repository dispatch | intended multi-platform draft release; currently contains stale repository names, frontend build flags, and output paths and is not a verified release path |
| `landing` | none in the repository | static content is owned and deployed independently through GitHub Pages settings |

The root `mobile-ci.yml` stored in `meta/root/.github/workflows/` is a dormant
template. No mobile repository is currently managed by `meta/repos.yaml`.

## Application Deployment Status

Backend and frontend do not retain persistent automatic post-merge CD or a
standalone operator-triggered rollback workflow. For an audited production
rollout in July 2026, each repository temporarily carried a manual-only
**Deploy Once** workflow. While present, that path:

- accepted only the current `main` SHA after successful push CI;
- built and published a SHA-tagged GHCR image;
- invoked the infrastructure `stocket-deploy` helper over restricted SSH. The
  helper waits up to 90 seconds for Compose image health (`/health-check/live`
  for the API and `/` for the web image); for backend it also requires
  host-local `/health-check/ready` and observes the same worker with zero
  restarts for 10 seconds;
- optionally checked a public URL after the helper returned, then attempted to
  move `:latest` to the SHA image.

Those workflows were removed after the one-time rollout; a normal merge never
triggered them. If a helper-owned Compose, backend readiness,
or worker-stability check fails after replacement starts, `stocket-deploy`
best-effort restores the prior image. The later public check is outside that
rollback boundary. A public-check or alias failure can therefore leave the
server on the SHA image while `:latest` remains unchanged; the SHA image also
remains in GHCR. This bounded failure recovery is not a general rollback
workflow or persistent CD surface.

The infrastructure repository operates the hosted single-box topology and its
deploy helper. Application image changes remain operator-controlled outside an
explicitly audited one-off rollout.

!!! warning "Offline terminology"
    The frontend has an installable PWA shell and offline fallback, and a Tauri
    shell exists. Inventory data and mutations still require the API. Do not
    describe the product as offline-first or synchronized offline storage.

## Backend CI

`backend/.github/workflows/ci.yml` runs four independent jobs on Node.js 22:

1. **lint** — frozen install from GitHub Packages, production audit, Oxlint,
   and TypeScript;
2. **test** — Vitest unit suite;
3. **integration-test** — real PostgreSQL service and the integration config;
4. **build** — bundles both `main.ts` and `task-worker.ts` with esbuild for
   Node.js 22.

The workflow does not require a production Better Auth secret because tests
provide their own controlled configuration.

## Frontend CI

`frontend/.github/workflows/ci.yml` runs:

- lint, format, type, dependency-audit, unit-test, and build jobs against the
  standalone frontend lockfile;
- a full-stack Playwright gate that checks out a pinned backend commit, starts
  PostgreSQL and LocalStack S3, builds both applications, seeds E2E tenants,
  verifies test discovery, and uploads browser/service diagnostics on failure.

When a frontend change depends on an unreleased backend or package change,
update the explicit revision pins only after testing the coordinated stack.

## Shared Package Releases

Packages publish to GitHub Packages under `@stocketfr/*`.

1. Every publishable change includes a Changeset (`pnpm changeset`).
2. A package pull request with a Changeset publishes immutable versions under
   a PR-specific dist tag for consumer testing.
3. Merges to `main` update or publish through the Changesets release pull
   request.
4. Merging that version PR creates stable package versions and GitHub releases.
5. Backend/frontend update their pinned npm aliases to the stable release.

Package source imports may use local names such as `@stocket/types`, while the
registry package is `@stocketfr/types`. GitHub Actions authenticates with
`GITHUB_TOKEN`; local users need a classic token with `read:packages`.

## Documentation Release

The dependency-free audit checks complete one-to-one navigation coverage,
relative links, and matching English/French page structure. Docs CI then
installs the three plugin families used by the site—MkDocs Material, static
i18n, and localized Git revision dates—and requires a strict build. A push to
`main` repeats the audit before deploying with `mkdocs gh-deploy --force`.

English pages are the default locale. French pages use `.fr.md`; missing French
translations fall back to English, but public user guides should be kept at
feature parity.

## Infrastructure Apply

The infrastructure pull-request workflow plans but does not mutate production.
The apply job requires an explicit manual dispatch with `apply=true` and the
protected `production` environment. It then:

1. applies Terraform using HCP Terraform state;
2. writes the generated Ansible inventory and sensitive variables to temporary
   files;
3. waits for cloud-init readiness;
4. configures the host with Ansible;
5. runs the verification playbook;
6. removes temporary sensitive files.

See the infrastructure repository for its database backup, destroy guard,
Datadog, Caddy, and operator recovery runbooks. Because application CD is
disconnected, an infrastructure apply alone does not publish a new application
version.

## Pull Request Expectations

- keep changes in the repository that owns them;
- explain cross-repository revisions and package snapshots explicitly;
- run the owning repository's local checks;
- include migrations and backward-compatible contracts where rollout order
  matters;
- update this page when a workflow is added, removed, or reconnected;
- never claim deployment success from CI-only checks.
