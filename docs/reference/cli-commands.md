# CLI Commands

The checkout contains independent repositories. Run each command from the repository named in its heading. The generated root pnpm workspace is useful for local navigation, but it is not the release boundary.

## Workspace controller (`meta`)

```bash
# Clone/update managed repositories, create root links, install, and build packages
./scripts/bootstrap

# Start PostgreSQL, MinIO, backend API, and frontend
./scripts/dev

# Also include the desktop shell or documentation watcher
./scripts/dev --include-desktop
./scripts/dev --include-docs

# Repository synchronization only
./scripts/clone-or-update
```

The current workspace accepts only `--include-desktop` and `--include-docs`. Docker-backed PostgreSQL and MinIO are attempted automatically when Docker is available; `--with-docker` is an obsolete flag.

The standard workspace process does not start the background task worker. Start it separately from `backend` for Smart Import jobs.

## Backend (`backend`)

```bash
pnpm start                   # API through Infisical and tsx
pnpm start:worker            # background task worker
pnpm start:workspace         # API with local workspace service overrides
pnpm build                   # bundle API and worker for Node 22
pnpm start:prod              # run built API
pnpm start:prod:worker       # run built worker
pnpm start:prod:infisical    # run built API through the configured Infisical launcher

pnpm type-check
pnpm lint
pnpm lint:fix
pnpm format

pnpm test
pnpm test:watch
pnpm test:cov
pnpm test:integration
pnpm test:mutation:pure
pnpm test:duplicates
```

Data and operations:

```bash
pnpm drizzle -- <drizzle-kit arguments>
pnpm tenant:seed:workspace
IMPORT_USER_ID=<user-uuid> pnpm import:products <normalized-products.csv>
```

`tenant:seed:workspace` is destructive for the selected tenant's demo dataset. Target an existing tenant with exactly one of `TENANT_ADMIN_TENANT_SLUG=<slug>` or `TENANT_ADMIN_TENANT_ID=<uuid>`; `TENANT_ADMIN_TENANT_HOSTNAME` can replace its primary hostname. With no target, the script selects the only tenant, prompts when several exist, or creates the default tenant when none exist. Inspect the target before running it outside an expendable local database.

`tenant-admin:seed:workspace` remains as a compatibility alias; prefer `tenant:seed:workspace`.

`superadmin:hash-password` reads a password from stdin and prints its Better Auth hash. Feed it from a hidden prompt provided by your shell; never place a literal password in command history. Seeding is a separate explicit script operation, normally through Infisical:

```bash
infisical run --env=dev -- pnpm exec tsx src/scripts/seed-superadmin.ts
```

Configure the `SUPERADMIN_*` values first. This CLI invocation is separate; API startup calls the same seed function only when its migration sequence runs and data migrations `0000`/`0001` are pending. Production skips that sequence unless `RUN_BETTER_AUTH_MIGRATIONS=true`.

The CLI importer accepts one already-normalized product CSV. `IMPORT_USER_ID` is required for attribution; `IMPORT_TENANT_ID`, `IMPORT_TENANT_NAME`, and `IMPORT_TENANT_SLUG` can override its tenant request context. Sortly recognition and review belong to the web Smart Import flow, not this CLI.

## Frontend (`frontend`)

```bash
pnpm dev
pnpm build
pnpm build:infisical         # build through the configured Infisical launcher
pnpm start                   # run the built SSR server

pnpm validate                # type-check + lint + format check
pnpm type-check
pnpm lint
pnpm lint:fix
pnpm format:check
pnpm check                   # rewrite formatting and apply lint fixes

pnpm test:unit
pnpm test:unit:watch
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
```

## Shared packages (`packages`)

```bash
pnpm build
pnpm --filter @stocketfr/types barrels
pnpm --filter @stocketfr/types build
pnpm --filter @stocketfr/emails test

pnpm changeset
pnpm version:packages
pnpm publish:prepare
pnpm release
```

Changesets drive release pull requests and publication to GitHub Packages. Normal publishable work adds a changeset; eligible same-repository pull requests publish immutable snapshots automatically. `version:packages` mutates package versions/changelogs and `release` publishes externally, so they are maintainer/CI operations rather than routine local checks.

## Remote desktop (`remote-desktop`)

```bash
pnpm dev
pnpm build
pnpm test
pnpm lint
```

The Tauri release path is experimental and currently needs reconciliation with the SSR frontend output before it can be treated as a supported release command.

## Documentation (`documentation`)

```bash
node scripts/audit-docs.mjs
mkdocs serve
mkdocs build --strict
```

Use the Python 3.12 virtual-environment setup in the repository README. The
current Nix shell does not reliably provide `mkdocs-static-i18n`, so it is not
the reproducible verification path yet. Pull requests run the audit and strict
build. Merges to `main` repeat the audit and deploy with `mkdocs gh-deploy` in
GitHub Actions.

## Infrastructure (`infrastructure`)

Infrastructure is intentionally outside the generated application workspace. Use Terraform and Ansible from that repository:

```bash
terraform fmt -check -recursive
terraform init
terraform validate
terraform plan

ansible-galaxy collection install -r ansible/requirements.yml
ansible-playbook -i localhost, -c local ansible/site.yml --syntax-check \
  --extra-vars @ansible/syntax-check-vars.yml
```

Production apply/destroy operations require protected credentials and review. Do not improvise them from this reference; follow the infrastructure repository runbook and destroy guard.

## GitHub Packages authentication

Package installs require a GitHub token with `read:packages` in the user-level npm configuration:

```ini
@stocketfr:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Keep the token out of repository files and shell history.
