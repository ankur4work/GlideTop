/**
 * Tests for the app-proxy signature gate.
 *
 * This is the only endpoint GlideTop exposes without an admin session, so it
 * is the one piece of the backend worth testing directly.
 *
 * Run with:  node web/lib/proxy-signature.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import { signProxyParams, verifyProxySignature } from "./proxy-signature.js";

const SECRET = "hush";

test("accepts a correctly signed request", () => {
  const params = { shop: "demo.myshopify.com", timestamp: "1700000000" };
  const signature = signProxyParams(params, SECRET);

  assert.equal(verifyProxySignature({ ...params, signature }, SECRET), true);
});

test("parameter order does not matter", () => {
  const params = { timestamp: "1700000000", shop: "demo.myshopify.com" };
  const signature = signProxyParams(params, SECRET);

  // Same pairs, declared in the opposite order.
  const reordered = { shop: "demo.myshopify.com", timestamp: "1700000000", signature };
  assert.equal(verifyProxySignature(reordered, SECRET), true);
});

test("joins repeated parameters with a comma", () => {
  const params = { extra: ["1", "2"], shop: "demo.myshopify.com" };
  const signature = signProxyParams(params, SECRET);

  assert.equal(verifyProxySignature({ ...params, signature }, SECRET), true);
});

test("rejects a missing signature", () => {
  assert.equal(verifyProxySignature({ shop: "demo.myshopify.com" }, SECRET), false);
});

test("rejects an empty signature", () => {
  assert.equal(
    verifyProxySignature({ shop: "demo.myshopify.com", signature: "" }, SECRET),
    false
  );
});

test("rejects a malformed signature", () => {
  assert.equal(
    verifyProxySignature({ shop: "demo.myshopify.com", signature: "nope" }, SECRET),
    false
  );
});

test("rejects a signature made with a different secret", () => {
  const params = { shop: "demo.myshopify.com", timestamp: "1700000000" };
  const signature = signProxyParams(params, "wrong-secret");

  assert.equal(verifyProxySignature({ ...params, signature }, SECRET), false);
});

test("rejects a tampered shop parameter", () => {
  const params = { shop: "victim.myshopify.com", timestamp: "1700000000" };
  const signature = signProxyParams(params, SECRET);

  const tampered = {
    shop: "attacker.myshopify.com",
    timestamp: "1700000000",
    signature,
  };

  assert.equal(verifyProxySignature(tampered, SECRET), false);
});

test("rejects an added parameter not covered by the signature", () => {
  const params = { shop: "demo.myshopify.com", timestamp: "1700000000" };
  const signature = signProxyParams(params, SECRET);

  assert.equal(
    verifyProxySignature({ ...params, signature, injected: "1" }, SECRET),
    false
  );
});

test("rejects when the secret is missing", () => {
  const params = { shop: "demo.myshopify.com" };
  const signature = signProxyParams(params, SECRET);

  assert.equal(verifyProxySignature({ ...params, signature }, ""), false);
  assert.equal(verifyProxySignature({ ...params, signature }, undefined), false);
});

test("rejects a non-object query", () => {
  assert.equal(verifyProxySignature(null, SECRET), false);
  assert.equal(verifyProxySignature(undefined, SECRET), false);
});
