# Stocket Documentation

This repository contains the public documentation for Stocket. The site is built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/), published at [stocketfr.github.io/documentation](https://stocketfr.github.io/documentation/), and maintained in English and French.

Stocket itself is split across several repositories. The [`meta`](https://github.com/stocketfr/meta) repository assembles them into a local workspace, while this repository can also be cloned and edited independently.

## Local preview

CI uses Node.js 22 for the dependency-free audit and Python 3.12 for MkDocs.
Create the same documentation dependency environment locally:

```sh
python3.12 -m venv .venv
. .venv/bin/activate
python -m pip install mkdocs-material mkdocs-static-i18n mkdocs-git-revision-date-localized-plugin
mkdocs serve
```

Open <http://127.0.0.1:8000> to preview the site.

The repository also contains a `flake.nix`, but its current development shell does not provide `mkdocs-static-i18n` successfully. Until that shell is corrected, use the Python environment above for a reproducible preview and build.

## Verification

Run the same strict build used for pull requests:

```sh
node scripts/audit-docs.mjs
mkdocs build --strict
```

The audit checks EN/FR pairing and structure, relative links, and complete one-to-one navigation coverage. The build must complete successfully, and content or navigation warnings should be resolved before review. A push to `main` publishes the site to GitHub Pages through the repository's deploy workflow.

## Repository layout

```text
docs/                  Documentation source
  getting-started/     Installation and first-use guides
  user-guide/          Product documentation
  development/         Architecture and development guides
  contributing/        Contribution and pull-request workflow
  reference/           Commands, configuration, and troubleshooting
mkdocs.yml              Site navigation, theme, and localization
scripts/audit-docs.mjs  Dependency-free documentation consistency audit
flake.nix               Nix development-shell definition (see limitation above)
```

## Languages

English is the default locale:

- `page.md` is the English source.
- `page.fr.md` is its French counterpart.
- Both versions should keep the same structure, facts, links, and examples.
- Pages without a French counterpart fall back to English, but new or substantially changed user-facing content should update both locales together.

When adding a page, also add it to `mkdocs.yml` and add any required French navigation label under `nav_translations`.

## Contributing

Start with the [contribution overview](docs/contributing/index.md), then read the [contribution guidelines](docs/contributing/guidelines.md) and [pull-request process](docs/contributing/pull-requests.md).

Documentation should be checked against the current implementation and repository workflows. Do not copy an older README or guide without verifying that its commands, environment variables, routes, and deployment claims still exist.
