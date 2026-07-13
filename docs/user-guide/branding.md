# Tenant Branding

Branding is part of **Settings**. Reading it needs `SETTINGS.READ`; saving changes needs `SETTINGS.WRITE`.

The read endpoint is public only after the request hostname has resolved to a verified tenant. Branding changes are not currently emitted to the tenant audit log.

## Fields and effects

| Field | Current behavior |
| --- | --- |
| App name | Sets the sidebar brand label/monogram and browser document title. |
| Tagline | Sets metadata description; it is not rendered as a visible subtitle. |
| Logo URL | Changes the sidebar logo. Login/signup/recovery pages keep the built-in Stocket mark. |
| Favicon URL | Changes the browser icon. |
| Primary color | Is persisted, but the current branding provider does not apply it to the visible theme. |

Use publicly reachable HTTPS asset URLs in deployed environments. Preview the sidebar and favicon after saving. Reads may be cached for up to five minutes, so other sessions do not always update immediately.

The current form is not visually disabled for a read-only Settings user, but the server rejects an attempted update without `SETTINGS.WRITE`.

For personal theme, language, account, and PWA behavior, see [Settings](settings.md).
