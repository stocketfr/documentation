# Authentication and Account Recovery

## Sign in

Open your tenant host and enter your email and password on `/login`. Stocket warns when the address is not verified and can resend the verification message. Success and reset banners appear when you return from those flows.

An unauthenticated visit to a protected tenant route redirects to login. A signed-in account must also have a membership in that tenant.

## Invitations and first access

Tenant administrators normally create users from **Admin → Users** and give them one or more roles. A welcome/reset link lets the new user set a password. Verification links expire after 24 hours and do not automatically sign the user in.

The public `/signup` page can create an authentication account, but it does not currently create a tenant membership. There is no tenant-admin UI to attach that self-signed account afterward, and trying to create the same email again fails. Treat membership provisioning as an out-of-band platform/operator action, not normal onboarding.

## Forgotten password

1. Choose **Forgot password** on the login page.
2. Submit the account email. The response is intentionally the same whether the address exists or not.
3. Follow the emailed link to `/reset-password` and choose a new password.

A successful reset revokes existing sessions. Sign in again on each device.

## Security actions

A ban/unban applies to the global account across all tenant memberships. Session revocation also ends all sessions globally. Deleting from a tenant removes that tenant's roles/membership and deletes the global account only after its final membership is gone. Users can sign out from **Settings → Account**.
