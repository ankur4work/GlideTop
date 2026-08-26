import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";
import { restResources } from "@shopify/shopify-api/rest/admin/2023-04";
import dotenv from "dotenv";

dotenv.config();

/**
 * Billing plans.
 *
 * These strings are the subscription names Shopify stores against each
 * merchant, and plan detection matches on them exactly. Renaming one after
 * merchants have subscribed will report those merchants as "free" and strip
 * their paid features — override via env instead of editing the defaults.
 *
 *   UI label        Price     Constant
 *   Basic           $10/mo    BASIC_PLAN
 *   Premium         $30/mo    PREMIUM_PLAN
 */
export const BASIC_PLAN = process.env.BASIC_PLAN_NAME || "GlideTop Basic";
export const PREMIUM_PLAN = process.env.PREMIUM_PLAN_NAME || "GlideTop Premium";

const billingConfig = {
  [BASIC_PLAN]: {
    amount: 10,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
  [PREMIUM_PLAN]: {
    amount: 30,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
};

if (!process.env.HOST) {
  throw new Error("HOST is not set. GlideTop cannot start without its public URL.");
}

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not set. GlideTop needs MongoDB for session storage.");
}

const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    hostName: process.env.HOST.replace(/https?:\/\//, ""),
    scopes: process.env.SCOPES ? process.env.SCOPES.split(",") : [],
    billing: billingConfig,
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage: new MongoDBSessionStorage(
    process.env.MONGODB_URI,
    process.env.MONGODB_DB || "glidetop"
  ),
});

export default shopify;
