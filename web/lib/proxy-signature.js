import crypto from "crypto";

/**
 * Verify a Shopify app-proxy request signature.
 *
 * Shopify signs proxy requests by removing the `signature` parameter, sorting
 * the rest by key, concatenating them as `key=value` with **no separator**, and
 * HMAC-SHA256'ing that string with the app's shared secret. Repeated
 * parameters are joined with commas before signing.
 *
 * https://shopify.dev/docs/apps/build/online-store/display-dynamic-data#calculate-a-digital-signature
 *
 * @param {Record<string, string | string[]>} query - the parsed query string
 * @param {string} secret - the app's shared secret (SHOPIFY_API_SECRET)
 * @returns {boolean} true only for a signature this app could have produced
 */
export function verifyProxySignature(query, secret) {
  if (!secret) return false;
  if (!query || typeof query !== "object") return false;

  const { signature, ...rest } = query;
  if (typeof signature !== "string" || signature.length === 0) return false;

  const message = Object.keys(rest)
    .sort()
    .map((key) => {
      const value = rest[key];
      return `${key}=${Array.isArray(value) ? value.join(",") : value}`;
    })
    .join("");

  const digest = crypto.createHmac("sha256", secret).update(message).digest("hex");

  const expected = Buffer.from(digest, "utf8");
  const received = Buffer.from(signature, "utf8");

  // timingSafeEqual throws on a length mismatch, so compare lengths first. The
  // length of a hex digest is not secret, so this leaks nothing useful.
  if (expected.length !== received.length) return false;

  return crypto.timingSafeEqual(expected, received);
}

/**
 * Produce a proxy signature. Used by the test suite to build valid requests;
 * Shopify does this on the real path.
 *
 * @param {Record<string, string | string[]>} params - query params, no `signature`
 * @param {string} secret
 */
export function signProxyParams(params, secret) {
  const message = Object.keys(params)
    .sort()
    .map((key) => {
      const value = params[key];
      return `${key}=${Array.isArray(value) ? value.join(",") : value}`;
    })
    .join("");

  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}
