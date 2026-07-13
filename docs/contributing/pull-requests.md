# Pull Request Process

Pull requests are repository-scoped. Open the pull request in the repository that owns the change, even when you developed it through the combined local workspace.

## Before opening a pull request

Confirm that:

- The branch contains one coherent change and does not include generated workspace files or unrelated edits.
- Relevant tests, linting, type checks, and builds have been run as described in the [contribution guidelines](guidelines.md).
- New behavior has focused tests, or the description explains why an automated test is not practical.
- User, developer, operations, and reference documentation have been updated where applicable.
- English and French documentation counterparts remain synchronized.
- No credentials, tokens, production data, local environment files, or sensitive logs are present.
- The branch is based on a sufficiently recent `main` to make the CI result meaningful.

Do not run every project check by default. Run the smallest relevant set locally and let the target repository's CI provide the full repository gate.

## Cross-repository changes

A workspace checkout does not turn the projects into one repository. When a change spans repositories:

1. Open a separate pull request in each affected repository.
2. Link every companion pull request in each description.
3. State the dependency and merge order.
4. Keep compatibility across the transition whenever possible.
5. For a publishable `@stocketfr/*` package change, include a Changeset and use the package pull request's snapshot version to test consumer pull requests when needed.
6. Update this documentation with the public behavior that will exist after the complete set lands.

Do not describe a companion pull request as deployed merely because it has merged. Release and deployment automation differs by repository.

## Pull-request description

Use a description that gives reviewers enough evidence to evaluate the outcome:

```markdown
## Summary

Describe the user or operational outcome and why the change is needed.

## Changes

- Describe the important implementation changes.
- Call out migrations, compatibility decisions, or security-sensitive behavior.

## Related work

- Closes #123
- Depends on stocketfr/packages#456
- Companion documentation: stocketfr/documentation#789

## Verification

- `command that was run` — passed
- Manual scenario — result
- Not run: check and reason

## Documentation

- [ ] User/developer/reference documentation updated
- [ ] English and French counterparts synchronized
- [ ] No documentation change required, with reason

## Screenshots

Add before/after screenshots or a short recording for visible UI changes.
```

Remove sections that genuinely do not apply, but always retain a concrete summary and verification evidence.

## Automated checks

Checks are defined per repository at the current architecture:

| Repository | Pull-request checks |
| --- | --- |
| `backend` | Dependency audit, lint, type check, unit tests, PostgreSQL integration tests, Node 22 build |
| `frontend` | Dependency audit, lint, formatting, type check, unit tests, production build, full-stack Playwright tests with Postgres and S3-compatible storage |
| `packages` | Package build; publishable changes can also produce immutable PR snapshots |
| `documentation` | `node scripts/audit-docs.mjs` for parity/links/nav, then `mkdocs build --strict` for both locales |
| `infrastructure` | Destroy-guard tests, Terraform format/validate/plan, Ansible and rendered-service checks |
| `remote-desktop` | UI lint and unit tests |

The `meta` and `landing` repositories currently have no repository-local pull-request workflow, so their descriptions must identify the manual checks that were performed.

Backend and frontend pull requests validate application artifacts but do not publish or deploy them. The temporary July 2026 one-off rollout path was a separate manual dispatch restricted to current `main` after successful push CI. Infrastructure apply is also a separate, protected manual action; a successful plan does not change production.

All required checks for the target repository must pass before merge. If a check fails for a reason unrelated to the pull request, document the evidence rather than retrying blindly or weakening the check.

## Review

Reviewers evaluate:

- Correctness and clarity of the implementation.
- Tenant isolation, authorization, secrets handling, and other security boundaries.
- Compatibility of shared contracts and cross-repository dependencies.
- Test quality and failure behavior.
- User experience, accessibility, SSR, and offline implications for frontend work.
- Operational safety, rollback/recovery considerations, and observability for infrastructure or background work.
- Accuracy and language parity of documentation.

Respond to each actionable thread. Push focused follow-up commits, explain disagreements with technical evidence, and request another review once the discussion and checks are current.

## Updating the branch

If the target branch has moved and the pull request cannot be merged or its result is stale, update your branch using the repository's accepted workflow. For a private feature branch, a rebase can be performed with:

```sh
git fetch origin
git rebase origin/main
git push --force-with-lease
```

Never force-push a shared branch without coordinating with its other contributors. Resolve conflicts in the owning repository and rerun the affected checks.

## Merge and release boundaries

Maintainers merge after review and required checks. Merge does not have the same downstream effect in every repository:

- `documentation`: a push to `main` runs the GitHub Pages deployment workflow.
- `packages`: Changesets updates or creates a release pull request; merging that version pull request publishes stable packages and GitHub releases.
- `infrastructure`: production apply requires an explicit workflow input and protected environment; merging a plan does not apply it.
- `remote-desktop`: packaging is handled by a separate tag or dispatch release workflow, not by normal CI.
- `backend` and `frontend`: merge does not publish or deploy automatically. A
  temporary one-off workflow, when present for an audited rollout, still needs
  an explicit dispatch and accepts only current `main` after successful CI.

Where rollout, migration, package publication, or manual verification remains, keep the related issue open until that work is complete.

## After merge

- Remove the feature branch when it is no longer needed.
- Confirm linked issues and companion pull requests reflect the actual remaining work.
- For documentation changes, verify the Pages workflow and published navigation.
- For package changes, follow the Changesets release pull request through consumer updates.
- Record any deferred cleanup or operational follow-up as an issue rather than leaving it only in a merged discussion.
