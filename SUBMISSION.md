# GlideTop — App Store submission checklist

Work top to bottom. Everything above the line is blocking.

---

## 1. Things only you can do

- [ ] Create the app in the Partner Dashboard, named **GlideTop**
      (confirm the name isn't taken before committing to it)
- [ ] Create the GitHub repo and push this project
- [ ] Copy `SHOPIFY_API_KEY` (client ID) and `SHOPIFY_API_SECRET`
- [ ] Point a domain at the Coolify host `91.239.208.85`
- [ ] Provision MongoDB
- [ ] Publish a **privacy policy** at a public URL — Shopify will not approve a
      listing without one
- [ ] Set up a monitored **support email**

## 2. Replace the placeholders

Three literal placeholders ship in the repo. Search for `REPLACE_ME`:

| File | Placeholder | Replace with |
|---|---|---|
| `shopify.app.toml` | `REPLACE_ME_CLIENT_ID` | your client ID |
| `shopify.app.toml` | `REPLACE_ME_DOMAIN` (×4) | your domain |

Then set `GLIDETOP_SUPPORT_EMAIL` as a build argument in Coolify — otherwise the
Support page falls back to `support@glidetop.app`, which is not yours.

## 3. Deploy

Follow [DEPLOY-COOLIFY.md](DEPLOY-COOLIFY.md). Keep `BILLING_TEST=true` through
review so Shopify's reviewer isn't charged real money.

## 4. Billing plans in the Partner Dashboard

The plan names in code must match what Shopify records on the subscription:

- `GlideTop Basic` — $10 USD / 30 days
- `GlideTop Premium` — $30 USD / 30 days

These come from `web/shopify.js`. Changing them after a merchant subscribes
reports that merchant as **free** and strips their paid features.

## 5. Listing content you still need to write

- [ ] App icon (1200×1200)
- [ ] Feature image (1600×900)
- [ ] 3–6 screenshots — the dashboard, the interactive preview, and the pricing
      page all screenshot well
- [ ] A demo video is optional but reduces review round-trips
- [ ] App introduction (100 chars) and detailed description
- [ ] Choose the category: **Store design → Page enhancements**

## 6. Review readiness

- [ ] Test store with GlideTop installed, app embed **enabled** on the live theme
- [ ] Reviewer instructions spelling out: *the button only appears after the app
      embed is toggled on in Online Store → Themes → Customize → App embeds*.
      This is the single most common cause of a "the app does nothing" rejection
      for embed-based apps.
- [ ] Verify the free tier works without any charge — reviewers test that first
- [ ] Confirm the GDPR webhook endpoints respond (`/api/webhooks`)
- [ ] Run through the eight verification steps in DEPLOY-COOLIFY.md §7

## 7. Known review risk

GlideTop is derived from an existing codebase (Scroll2Top). Shopify rejects
apps that duplicate a listing already on the store, and reviewing both under one
Partner account raises that flag.

What is already different: a rewritten storefront button (progress ring,
different behaviour, accessibility work, session-cached entitlement), a new
signed proxy endpoint, a rewritten admin UI with an interactive preview, a new
information architecture, and a different visual identity.

If the two apps will be listed simultaneously, be ready to explain how they
differ in purpose — or list them under separate Partner accounts.

---

## After approval

- [ ] Set `BILLING_TEST=false` and redeploy — **without this, no merchant is
      ever actually charged**
- [ ] Verify a real charge on a live store
