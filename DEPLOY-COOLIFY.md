# Deploying GlideTop to Coolify

Target: the self-hosted Coolify instance at `http://91.239.208.85:8000`.
Domain: **https://glidetop.onkra.online**

> **Deployed and verified 2026-08-26.** The backend is live: `/health` returns
> `{"ok":true,...}`, unsigned app-proxy calls return 401, and both the
> application and MongoDB report `running:healthy`. The build was not
> OOM-killed, and installing `curl` in the runtime image did prevent the
> health-check rollback trap. Resource IDs live in `.deploy/coolify.env`.
>
> Still outstanding: the theme app extension has never been deployed (step 5),
> so no storefront has the button yet.

This is a **brand-new app**, not a migration — there are no existing merchants
to protect, so plan names, database name and proxy path can be whatever we want.
They are already set; don't change them after the first merchant subscribes.

---

## 0. Collect these first

| Value | Where it comes from | Status |
|---|---|---|
| `SHOPIFY_API_KEY` (client ID) | Partner Dashboard → GlideTop → **API credentials** | ✅ `1b4036bc…` |
| `SHOPIFY_API_SECRET` | Same page. Treat as a secret — never commit it | ✅ in `.deploy/coolify.env` |
| Coolify API token | Coolify → **Keys & Tokens** → API tokens. Shaped `<id>\|<hash>` | ⛔ pending |
| DNS A record | `glidetop` → `91.239.208.85` | ⛔ pending |
| Extension UUID | Partner Dashboard → GlideTop → **Extensions**, after the first `shopify app deploy` | ⛔ pending |
| MongoDB connection string | New MongoDB resource in Coolify (step 3) | ⛔ pending |

---

## 1. The repo

Already pushed to <https://github.com/ankur4work/GlideTop> (public, branch
`main`). In Coolify: **New Resource → Application → Public Repository**, and
point it at that URL.

Because the repo is public, Coolify needs no deploy key or GitHub App.

## 2. Build settings

- Build pack: **Dockerfile** (at the repo root)
- Exposed port: **8081**
- Build arguments — these are baked into the frontend bundle and **must** be
  build args, not just runtime variables:

  | Argument | Value |
  |---|---|
  | `SHOPIFY_API_KEY` | `1b4036bce75ff13b0929fd06e72b792a` |
  | `GLIDETOP_EXTENSION_UUID` | from step 5, after the first extension deploy |
  | `GLIDETOP_SUPPORT_EMAIL` | a monitored address |

  On the very first deploy the extension UUID does not exist yet. Leave it
  empty — "Open theme editor" still works, it just lands on the App embeds
  panel without pre-selecting GlideTop. Set it and redeploy after step 5.

> **Host memory note.** This server runs ~80 containers and sits close to its
> memory ceiling. The Dockerfile pins the build heap to 1536 MB for that reason.
> If a build dies with **exit code 255 and no error message**, that is the OOM
> killer, not a code fault — retry when the host is quieter.

## 3. MongoDB

Coolify → **New Resource → Database → MongoDB**. Copy the connection string.

Note this adds another container to an already memory-starved host. If the
database or the build starts getting killed, move to MongoDB Atlas' free tier
and change only `MONGODB_URI` — nothing else in the app cares where Mongo lives.

## 4. Runtime environment variables

Set on the application (see `web/.env.example` for the annotated list):

```
SHOPIFY_API_KEY=1b4036bce75ff13b0929fd06e72b792a
SHOPIFY_API_SECRET=<secret>
HOST=https://glidetop.onkra.online
PORT=8081
NODE_ENV=production
SCOPES=
MONGODB_URI=<connection string>
MONGODB_DB=glidetop
BILLING_TEST=true
```

### Coolify API quirks (all hit during the first deploy, 2026-08-26)

- The env-var request field is **`is_buildtime`** (not `is_build_time`, which
  422s). Responses expose both `is_buildtime` and `is_runtime` — read the former
  back, or every variable will look like it isn't a build arg.
- `is_literal: true` wraps values in single quotes that arrive as part of the
  value. Pass `false`, and keep `$` out of env values entirely.
- `POST /api/v1/applications/{uuid}/envs` created **two identical records per
  key**. Harmless but confusing; de-duplicate by UUID afterwards, keeping one
  record per key.
- **`/api/v1/deploy` is POST**, not GET. A GET returns 405 with
  `{"message":"This endpoint has changed to a POST request."}`.
- A freshly created MongoDB briefly reports `exited:unhealthy` while it boots.
  Poll again before concluding anything failed.
- Generate database passwords as **alphanumeric only** — it sidesteps both the
  `$` quirk above and percent-encoding in the MongoDB connection URI.

`BILLING_TEST=true` makes Shopify create **test** charges. Leave it on through
App Store review, then set it to `false` and redeploy before launch.

## 5. Deploy the app and the extension

Point `glidetop.onkra.online` at the Coolify app so it can issue the TLS
certificate, deploy, then confirm:

```bash
curl https://glidetop.onkra.online/health
# {"ok":true,"app":"GlideTop","billingTestMode":true}
```

`ok:false` means one of `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `HOST` or
`MONGODB_URI` is missing — that endpoint is the config-drift detector.

Then push the theme app extension from your machine:

```bash
npm install
npx shopify app deploy
```

Grab the extension UUID from the Partner Dashboard, add it as the
`GLIDETOP_EXTENSION_UUID` build argument, and redeploy in Coolify.

## 6. Partner Dashboard configuration

`shopify.app.toml` already carries every one of these values, and
`shopify app deploy` pushes them to the dashboard — so this table is for
verification, not manual data entry.

| Field | Value |
|---|---|
| App URL | `https://glidetop.onkra.online` |
| Allowed redirection URLs | `https://glidetop.onkra.online/api/auth`<br>`https://glidetop.onkra.online/api/auth/callback` |
| App proxy — subpath prefix | `apps` |
| App proxy — subpath | `glidetop` |
| App proxy — URL | `https://glidetop.onkra.online/api/glidetop` |
| GDPR webhooks | `https://glidetop.onkra.online/api/webhooks` |

The app proxy is **required**. The storefront button resolves its plan through
`/apps/glidetop/entitlement`, and the backend rejects any request to that path
whose Shopify signature doesn't verify.

## 7. Verify before submitting

1. Install on a development store. The admin UI loads embedded, no console errors.
2. `/health` returns `ok:true`.
3. Theme editor → App embeds → GlideTop toggles on; the button appears in the preview.
4. Storefront: scroll past 200 px, the button glides in; click it, the page returns to top.
5. Network tab: exactly **one** call to `/apps/glidetop/entitlement` per session,
   not one per page.
6. Hit `/apps/glidetop/entitlement` directly with no `signature` query parameter
   — it must return **401**.
7. Subscribe to Basic on the dev store (a test charge), confirm the Plans page
   shows *Current* on Basic and that colour settings now apply on the storefront.
8. Cancel; confirm you drop back to Free and the button reverts to indigo.

## 8. Before going live

- `BILLING_TEST=false`, then redeploy.
- Confirm `GLIDETOP_SUPPORT_EMAIL` reaches a real inbox.
- Publish a privacy policy URL — Shopify will not approve the listing without one.
