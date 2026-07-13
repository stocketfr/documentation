# Contributing

Thank you for helping improve Stocket. Contributions can cover the product, its supporting projects, or this documentation.

## A multi-repository project

Stocket is developed across separate repositories for the backend, frontend, shared packages, infrastructure, desktop client, landing page, documentation, and workspace tooling. The `meta` repository assembles these projects into a convenient local workspace, but each project keeps its own history, CI workflow, and pull requests.

Open an issue or pull request in the repository that owns the change. Use the [documentation issue tracker](https://github.com/stocketfr/documentation/issues) for this site and the relevant project repository for implementation issues. Cross-repository work should use linked pull requests rather than combining unrelated histories.

## Ways to contribute

- **Report a defect** — Include reproducible steps, expected behavior, and the affected project.
- **Suggest an improvement** — Explain the user problem and the desired outcome.
- **Submit code** — Fix a bug, add a tested feature, or improve maintainability.
- **Improve documentation** — Correct stale behavior, add examples, or keep English and French content aligned.

## Getting started

1. Read the [contribution guidelines](guidelines.md).
2. Follow the [development setup](../development/setup.md) for a full workspace, or clone only the repository you need.
3. Confirm the issue and its owning repository before changing code.
4. Make the smallest coherent change and verify it locally.
5. Follow the [pull-request process](pull-requests.md).

## Documentation expectations

Treat current source code, package manifests, environment templates, and CI workflows as the source of truth. If a product change affects users, operations, configuration, or public contracts, update the relevant guide in the same work. Keep English and French counterparts synchronized.

## Conduct

Be respectful, constructive, and specific. Assume good intent, discuss technical trade-offs openly, and avoid sharing credentials, customer data, or other sensitive information in issues and pull requests.

## Getting help

- Search the relevant repository's existing issues and pull requests.
- Review the [development documentation](../development/index.md) and [project map](../development/project-map.md).
- Ask a focused question in the issue or pull request where the context already exists.
