# Settings

Open **Settings** to control your own appearance and account, plus tenant branding when authorized.

## Appearance and language

The five choices are Stocket Light, Stocket Dark, Light, Dark, and System. System follows the operating-system preference with the neutral light/dark themes. Choose English, German, or French for the application language.

## Account

The current account section provides sign out; it does not display or edit profile details.

## Tenant branding

Users with `SETTINGS.READ` can view branding; updates require `SETTINGS.WRITE`.

| Field | Current visible effect |
| --- | --- |
| App name | Sidebar identity and document title. |
| Tagline | Page metadata description; it is not a visible sidebar subtitle. |
| Logo URL | Tenant sidebar logo. Authentication pages still use the built-in Stocket mark. |
| Favicon URL | Browser icon. |
| Primary color | Stored for the tenant but not yet applied to the visible theme. |

Branding reads can be cached for up to five minutes. Refresh later if another user does not immediately see a change. The current form remains editable-looking for read-only users, but the server rejects updates without `SETTINGS.WRITE`.

The PWA precaches the offline fallback, manifest, and brand icons and can cache fetched static assets. Successful navigation HTML and API data are not available offline; settings and all data operations require a connection.
