# Security Policy

## Reporting a vulnerability

Email **security@glidetop.app** with a description of the issue and, where
possible, steps to reproduce it. Please do not open a public issue for security
reports.

We aim to acknowledge reports within two business days and to ship a fix for
confirmed issues within seven days.

Please do not test against stores you do not own. If you need a target, create
a Shopify development store and install GlideTop there.

> This policy covers GlideTop only. Vulnerabilities in Shopify's own platform go
> to [Shopify's HackerOne program](https://hackerone.com/shopify), not here.

## Supported versions

GlideTop is a hosted application. Only the currently deployed version is
supported; there are no maintained release branches.

## Security posture

- **App proxy is signed.** `/api/glidetop/entitlement` is the only endpoint
  reachable without an admin session. Every request must carry a valid Shopify
  HMAC signature, verified with a constant-time comparison in
  `web/lib/proxy-signature.js`. Unsigned or tampered requests get 401. Covered
  by `web/lib/proxy-signature.test.mjs`.
- **Every other `/api/*` route** sits behind
  `shopify.validateAuthenticatedSession()`.
- **No Admin API access scopes are requested.** Reading subscriptions and
  writing the app-owned tier metafield need none.
- **No customer data is stored.** GlideTop persists the shop domain and access
  token for session storage, plus one metafield recording the shop's tier.
- **Nothing third-party runs on the storefront.** The theme extension loads no
  external scripts, fonts or images, sets no cookies, and performs no tracking.
- **Secrets are never bundled.** `SHOPIFY_API_SECRET` is server-side only. The
  client ID (`SHOPIFY_API_KEY`) is public by design and is the only credential
  baked into the frontend bundle.
- **Mandatory GDPR webhooks** are implemented in `web/gdpr.js`.
