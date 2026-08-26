// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import dotenv from "dotenv";

import shopify, { BASIC_PLAN, PREMIUM_PLAN } from "./shopify.js";
import GDPRWebhookHandlers from "./gdpr.js";
import cancelSubscription from "./cancel-subscription.js";
import { connectToMongoDB } from "./mongodb.js";
import { verifyProxySignature } from "./lib/proxy-signature.js";

dotenv.config();

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const APP_NAME = "GlideTop";

// App-owned metafield recording the shop's tier. Nothing in the storefront
// reads it today — the theme extension resolves entitlement over the proxy —
// but it gives support a way to see a shop's tier without a billing call.
const METAFIELD_NAMESPACE = "$app:glidetop";
const METAFIELD_KEY = "plan";

// When BILLING_TEST=true, billing.request creates *test* charges (no real
// money). Turn it on for App Store review and QA. Plan detection below matches
// on name + ACTIVE status and ignores the test flag, so flipping this never
// drops a merchant who is already paying.
const IS_TEST = process.env.BILLING_TEST === "true";

const HTTP = { OK: 200, BAD_REQUEST: 400, UNAUTHORIZED: 401, SERVER_ERROR: 500 };

const app = express();

/* --------------------------- Shopify auth plumbing -------------------------- */

app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Container health probe. Mounted outside /api so it stays unauthenticated,
// and before the catch-all so it never falls through to the SPA shell.
app.get("/health", (_req, res) => {
  const configured = Boolean(
    process.env.SHOPIFY_API_KEY &&
      process.env.SHOPIFY_API_SECRET &&
      process.env.HOST &&
      process.env.MONGODB_URI
  );
  res.status(configured ? 200 : 503).json({
    ok: configured,
    app: APP_NAME,
    billingTestMode: IS_TEST,
  });
});

/* ------------------------------ GraphQL queries ----------------------------- */

// `test` is selected for logging only. Plan detection matches on name + ACTIVE
// status so a development-store charge (always test: true) counts the same as a
// production charge — otherwise an approved plan reads as "free" during review.
const ACTIVE_SUBSCRIPTIONS_QUERY = `
  query currentActiveSubscriptions {
    currentAppInstallation {
      activeSubscriptions {
        name
        status
        test
      }
    }
  }
`;

const CURRENT_APP_INSTALLATION = `
  query appInstallationMetafield($namespace: String!, $key: String!) {
    currentAppInstallation {
      id
      metafield(namespace: $namespace, key: $key) {
        id
        namespace
        key
        value
      }
    }
  }
`;

const METAFIELDS_SET = `
  mutation setAppMetafield($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id namespace key value }
      userErrors { field message }
    }
  }
`;

// `metafieldsDelete` is the valid Admin API mutation for this;
// `appOwnedMetafieldDelete` does not exist.
const METAFIELDS_DELETE = `
  mutation deleteAppMetafield($metafields: [MetafieldIdentifierInput!]!) {
    metafieldsDelete(metafields: $metafields) {
      deletedMetafields { key namespace ownerId }
      userErrors { field message }
    }
  }
`;

const SHOP_DETAILS_QUERY = `
  query shopDetails {
    shop {
      name
      email
      myshopifyDomain
      primaryDomain { url host }
      plan { displayName }
    }
  }
`;

/* ------------------------------- Plan helpers ------------------------------- */

// @shopify/shopify-api v11 returns { data, extensions, headers } from
// client.request(); other call styles nest it under .body.data. Tolerate both
// so downstream reads never silently see `undefined`.
const gqlData = (resp) => resp?.data ?? resp?.body?.data ?? resp;

async function getActiveSubscriptions(session) {
  const client = new shopify.api.clients.Graphql({ session });
  const resp = await client.request(ACTIVE_SUBSCRIPTIONS_QUERY);
  return gqlData(resp)?.currentAppInstallation?.activeSubscriptions ?? [];
}

/**
 * Resolve a shop's tier from its live Shopify subscriptions.
 *
 * We deliberately avoid shopify.api.billing.check(): it filters by the `test`
 * flag, which silently misreports development stores during App Store review.
 *
 * @returns {Promise<"free"|"basic"|"premium">}
 */
async function getPlanTier(session) {
  try {
    const active = (await getActiveSubscriptions(session)).filter(
      (s) => s?.status === "ACTIVE"
    );
    if (active.some((s) => s?.name === PREMIUM_PLAN)) return "premium";
    if (active.some((s) => s?.name === BASIC_PLAN)) return "basic";
    return "free";
  } catch (error) {
    console.error("Failed to resolve plan tier:", error);
    return "free";
  }
}

/**
 * Best-effort sync of the app-owned tier metafield. The caller's operation
 * (subscribe / cancel) has already succeeded by the time this runs, so a
 * failure here must never propagate.
 */
async function syncPlanMetafield(session, tier) {
  try {
    const client = new shopify.api.clients.Graphql({ session });
    const current = await client.request(CURRENT_APP_INSTALLATION, {
      variables: { namespace: METAFIELD_NAMESPACE, key: METAFIELD_KEY },
    });

    const installation = gqlData(current)?.currentAppInstallation;
    const ownerId = installation?.id;
    if (!ownerId) return;

    if (tier === "free") {
      if (!installation?.metafield) return;
      const resp = await client.request(METAFIELDS_DELETE, {
        variables: {
          metafields: [
            { ownerId, namespace: METAFIELD_NAMESPACE, key: METAFIELD_KEY },
          ],
        },
      });
      const errors = gqlData(resp)?.metafieldsDelete?.userErrors || [];
      if (errors.length) console.error("Metafield delete errors:", errors);
      return;
    }

    const resp = await client.request(METAFIELDS_SET, {
      variables: {
        metafields: [
          {
            ownerId,
            namespace: METAFIELD_NAMESPACE,
            key: METAFIELD_KEY,
            type: "single_line_text_field",
            value: tier,
          },
        ],
      },
    });
    const errors = gqlData(resp)?.metafieldsSet?.userErrors || [];
    if (errors.length) console.error("Metafield set errors:", errors);
  } catch (error) {
    console.error("Metafield sync failed (non-fatal):", error?.message || error);
  }
}

/* --------------------------- Public storefront API -------------------------- */

/**
 * Storefront entitlement lookup, reached via the signed app proxy at
 * /apps/glidetop/entitlement.
 *
 * Mounted before validateAuthenticatedSession() because storefront visitors
 * have no admin session — the proxy signature is what authenticates them.
 */
app.get("/api/glidetop/entitlement", async (req, res) => {
  try {
    const secret = process.env.SHOPIFY_API_SECRET;
    if (!secret) {
      console.error("SHOPIFY_API_SECRET is not set — cannot verify proxy requests");
      return res.status(HTTP.SERVER_ERROR).json({ error: "Server misconfigured" });
    }

    if (!verifyProxySignature(req.query, secret)) {
      return res.status(HTTP.UNAUTHORIZED).json({ error: "Invalid proxy signature" });
    }

    const shop = typeof req.query.shop === "string" ? req.query.shop : null;
    if (!shop) {
      return res.status(HTTP.BAD_REQUEST).json({ error: "Missing shop parameter" });
    }

    const sessions = await connectToMongoDB();
    const session = await sessions.findOne({ shop });

    // No session means the app was uninstalled. Degrade to "free" rather than
    // erroring: the storefront should still render something sane.
    if (!session) {
      return res.status(HTTP.OK).json({ tier: "free", hasActiveSubscription: false });
    }

    const tier = await getPlanTier(session);

    // Storefronts are heavily cached; let the CDN hold this briefly.
    res.set("Cache-Control", "public, max-age=60");
    return res.status(HTTP.OK).json({ tier, hasActiveSubscription: tier !== "free" });
  } catch (error) {
    console.error("Entitlement lookup failed:", error);
    return res.status(HTTP.SERVER_ERROR).json({ error: "Failed to resolve entitlement" });
  }
});

/* ------------------- Everything below requires an admin session ------------- */

app.use("/api/*", shopify.validateAuthenticatedSession());

app.get("/api/plan", async (_req, res) => {
  try {
    const session = res.locals.shopify.session;
    const tier = await getPlanTier(session);

    if (tier !== "free") await syncPlanMetafield(session, tier);

    res.status(HTTP.OK).json({ tier, hasActiveSubscription: tier !== "free" });
  } catch (error) {
    console.error("Failed to read plan:", error);
    res.status(HTTP.SERVER_ERROR).json({ error: "Failed to read plan" });
  }
});

app.get("/api/plan/subscribe", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const requested = (req.query.plan || "").toString().toLowerCase();

    if (requested !== "basic" && requested !== "premium") {
      return res
        .status(HTTP.BAD_REQUEST)
        .json({ error: "plan must be 'basic' or 'premium'" });
    }

    const planName = requested === "premium" ? PREMIUM_PLAN : BASIC_PLAN;

    const active = (await getActiveSubscriptions(session)).filter(
      (s) => s?.status === "ACTIVE"
    );

    if (active.some((s) => s?.name === planName)) {
      return res.status(HTTP.OK).json({ alreadyActive: true, plan: requested });
    }

    const confirmationUrl = await shopify.api.billing.request({
      session,
      plan: planName,
      isTest: IS_TEST,
    });

    res.status(HTTP.OK).json({ alreadyActive: false, plan: requested, confirmationUrl });
  } catch (error) {
    console.error("Failed to start subscription:", error);
    res.status(HTTP.SERVER_ERROR).json({ error: "Failed to start subscription" });
  }
});

app.get("/api/plan/cancel", async (_req, res) => {
  try {
    const session = res.locals.shopify.session;
    const tier = await getPlanTier(session);

    if (tier === "free") {
      return res.status(HTTP.OK).json({ status: "no-subscription" });
    }

    const status = await cancelSubscription(session);
    console.log(`${session.shop} cancelled its subscription (status: ${status})`);

    await syncPlanMetafield(session, "free");

    res.status(HTTP.OK).json({ status, cancelledTier: tier });
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    res.status(HTTP.SERVER_ERROR).json({ error: "Failed to cancel subscription" });
  }
});

app.get("/api/shop", async (_req, res) => {
  try {
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Graphql({ session });
    const resp = await client.request(SHOP_DETAILS_QUERY);
    const shop = gqlData(resp)?.shop ?? {};

    res.status(HTTP.OK).json({
      appName: APP_NAME,
      domain: session.shop,
      name: shop.name ?? null,
      email: shop.email ?? null,
      primaryDomain: shop.primaryDomain?.url ?? null,
      shopifyPlan: shop.plan?.displayName ?? null,
    });
  } catch (error) {
    console.error("Failed to read shop details:", error);
    res.status(HTTP.SERVER_ERROR).json({ error: "Failed to read shop details" });
  }
});

/* ------------------------------ Serve frontend ------------------------------ */

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));
app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) =>
  res
    .status(HTTP.OK)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")))
);

app.listen(PORT, () =>
  console.log(`🚀 ${APP_NAME} server running on http://localhost:${PORT}`)
);
