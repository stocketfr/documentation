# Reference

Use this section when you need the exact runtime settings, repository commands, or a quick diagnosis.

## Runtime reference

- [Environment variables](environment-variables.md) lists the backend, worker, web, storage, and test settings.
- [CLI commands](cli-commands.md) lists commands by repository. Run them from the named repository unless stated otherwise.
- [Troubleshooting](troubleshooting.md) covers the failures most often seen in the local workspace.

## API and contracts

Application routes are served below `/api/v1`; that prefix includes tenant, platform/superadmin, operational, and non-production test surfaces. Better Auth is below `/api/auth`. Swagger UI at `/docs` currently describes only health. Mounted backend routers are the runtime source of truth, and their matching `@stocketfr/types` schemas define payload contracts. Not every exported schema is mounted—for example, fulfillment remains a prototype.

Applications install the published packages through GitHub Packages:

```json
{
  "dependencies": {
    "@stocket/types": "npm:@stocketfr/types@1.8.0"
  }
}
```

`@stocket/types` is the local consumer alias. Commands inside the packages repository must use the publisher name, for example `pnpm --filter @stocketfr/types build`.

For the ownership and runtime boundary of every repository and module, see the [project and module map](../development/project-map.md).
