# Notifications

Stocket currently sends transactional email and low-stock alerts. There is no Notifications settings page in the frontend yet; preference management is available through the authenticated tenant API at `/api/v1/notifications/preferences`.

## Categories

| Category | Current behavior |
| --- | --- |
| Account | Verification, password reset, and welcome messages. Mandatory account messages cannot be opted out. |
| Inventory alerts | Low-stock email. Users with `INVENTORY.READ` are eligible unless they opt out. |
| Order lifecycle | Reserved preference category; order-status email delivery is not implemented today. |

Email is the only notification channel. Defaults are enabled, but the GET response returns stored preference rows rather than synthesizing every default row.

## Low-stock scan

The backend checks roughly once per minute. A product/location at or below its reorder point can generate an email to eligible users. Delivery is deduplicated once per user, product, and location per day.

In development/test, email is logged through the console transport. Staging and production require Resend configuration. Account-email hooks run asynchronously, so a mail failure does not roll back the account action. Low-stock delivery comes from the scheduled scan, not directly from an inventory mutation.
