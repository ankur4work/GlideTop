# GlideTop

A floating back-to-top control for Shopify storefronts. It arrives once a
shopper has scrolled, doubles as a scroll-progress indicator, and glides the
page back to the top without an abrupt jump.

Ships as a **theme app embed**, so it never writes to a merchant's theme files
and uninstalls without leaving anything behind.

---

## What it does

- Momentum-eased return to top, with a `prefers-reduced-motion` fallback
- Scroll-progress ring rendered into the button itself
- Six icon styles, three shapes, configurable size, corner and offsets
- Independent background / hover / icon / ring colours
- Per-template visibility: home, product, collection, and content pages
- Optional text label, turning the circle into a pill
- Real `<button>` semantics: focus ring, configurable ARIA label, and focus
  moved to `<main>` on activation rather than only moving the viewport

## Plans

| | Free | Basic $10/mo | Premium $30/mo |
|---|---|---|---|
| Animated return to top | ✓ | ✓ | ✓ |
| Home page | ✓ | ✓ | ✓ |
| Custom colours, icon, shape, size | — | ✓ | ✓ |
| Product / collection / content pages | — | — | ✓ |
| Scroll-progress ring | — | — | ✓ |

Billing runs through Shopify's billing API. Plan names are defined in
`web/shopify.js` and matched by name — see the warning there before changing
them.

---

## Architecture

```
extensions/glidetop/        Theme app embed — the storefront button
  blocks/glidetop.liquid    Markup, styles and behaviour in one file

web/
  index.js                  Express server: auth, billing, entitlement proxy
  shopify.js                Shopify app config and billing plan definitions
  mongodb.js                Session-storage connection
  cancel-subscription.js    Subscription cancellation
  gdpr.js                   Mandatory compliance webhooks
  lib/proxy-signature.js    App-proxy HMAC verification (+ tests)
  frontend/                 Embedded admin UI — React 17, Vite, Polaris 10
    pages/                  File-based routes
    components/             Shared UI, including the interactive preview
    lib/plans.js            Plan metadata shared by dashboard and pricing
```

### How entitlement reaches the storefront

The theme extension cannot see the merchant's subscription, so it asks the
backend through Shopify's app proxy:

```
storefront  →  /apps/glidetop/entitlement          (Shopify signs the request)
            →  https://<host>/api/glidetop/entitlement
            ←  { "tier": "free" | "basic" | "premium" }
```

The backend verifies the HMAC signature on every one of those calls and returns
401 if it doesn't match, so the endpoint can't be used to probe arbitrary shops.

The result is cached in `sessionStorage` for ten minutes. Browsing twenty pages
costs one request, not twenty. That cache is also why a plan change can take up
to ten minutes to show on a storefront the shopper already had open.

Tier names are identical across the Liquid, the API and the React UI
(`free` / `basic` / `premium`) — there is deliberately no remapping layer.

---

## Local development

```bash
npm install
npx shopify app dev
```

Backend and frontend dependencies install separately:

```bash
cd web && npm install
cd web/frontend && npm install
```

### Tests

```bash
cd web && npm test
```

Covers the app-proxy signature gate — the only endpoint exposed without an
admin session.

### Building the frontend by hand

`SHOPIFY_API_KEY` is baked into the bundle at build time. Without it the admin
UI renders a "Missing Shopify API Key" banner and nothing else:

```bash
cd web/frontend
SHOPIFY_API_KEY=<client id> npm run build
```

Two further build-time values are optional but recommended —
`GLIDETOP_EXTENSION_UUID` (pre-selects GlideTop in the theme editor) and
`GLIDETOP_SUPPORT_EMAIL` (shown on the Support page).

## Deployment

See [DEPLOY-COOLIFY.md](DEPLOY-COOLIFY.md).

## Configuration

All environment variables are documented in [`web/.env.example`](web/.env.example).

## Data handling

GlideTop stores the shop domain and Shopify access token required for session
storage, and one app-owned metafield recording the shop's tier. It stores no
customer data, sets no cookies, and runs no analytics on the storefront.
Mandatory GDPR webhooks are implemented in `web/gdpr.js`.
