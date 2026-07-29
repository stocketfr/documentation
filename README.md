# Stocket Documentation (legacy)

> **Legacy component — publishing is disabled.** Canonical product and engineering documentation moved to [`stocketfr/stocket/docs`](https://github.com/stocketfr/stocket/tree/main/docs) from baseline `ed4ec2e97d6c5435530ffbb75af04b88035cea75`. This repository remains public migration provenance and is scheduled for archive under [`meta#43`](https://github.com/stocketfr/meta/issues/43); do not edit or deploy this historical site.

The source below is an immutable snapshot of the former English/French MkDocs site. It may contain excluded or superseded product guidance. New documentation, issues, and review belong in the canonical monorepo.

## Historical verification only

The final archival change is checked without publishing:

```sh
node scripts/audit-docs.mjs
python -m pip install mkdocs-material mkdocs-static-i18n mkdocs-git-revision-date-localized-plugin
mkdocs build --strict
```

These commands verify that the preserved snapshot remains internally consistent; they do not authorize content changes or deployment. The obsolete GitHub Pages deployment workflow has been removed.

## Preserved layout

- `docs/` — historical English/French documentation source
- `mkdocs.yml` — historical navigation, theme, and localization configuration
- `scripts/audit-docs.mjs` — locale, navigation, and relative-link audit

Repository history and the generated `gh-pages` branch remain available as provenance after archive. They are not current Stocket documentation authority.
