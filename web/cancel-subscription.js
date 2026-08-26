import shopify, { BASIC_PLAN, PREMIUM_PLAN } from "./shopify.js";

const ACTIVE_SUBSCRIPTIONS_QUERY = `
  query activeSubscriptions {
    currentAppInstallation {
      activeSubscriptions {
        id
        name
        status
        test
      }
    }
  }
`;

const CANCEL_SUBSCRIPTION = `
  mutation appSubscriptionCancel($id: ID!) {
    appSubscriptionCancel(id: $id) {
      appSubscription {
        id
        name
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const gqlData = (resp) => resp?.data ?? resp?.body?.data ?? resp;

/**
 * Cancel the shop's active GlideTop subscription.
 *
 * Only subscriptions that are ACTIVE *and* named as one of our plans are
 * considered — a shop may carry subscriptions from other apps, and cancelling
 * an arbitrary one would be destructive.
 *
 * @returns {Promise<string>} the resulting subscription status, or
 *   "no-subscription" when there was nothing to cancel.
 */
export default async function cancelSubscription(session) {
  const client = new shopify.api.clients.Graphql({ session });

  const resp = await client.request(ACTIVE_SUBSCRIPTIONS_QUERY);
  const subscriptions =
    gqlData(resp)?.currentAppInstallation?.activeSubscriptions ?? [];

  const ours = subscriptions.find(
    (s) =>
      s?.status === "ACTIVE" && (s?.name === BASIC_PLAN || s?.name === PREMIUM_PLAN)
  );

  if (!ours?.id) {
    console.log(`No active GlideTop subscription to cancel for ${session.shop}`);
    return "no-subscription";
  }

  const cancelResp = await client.request(CANCEL_SUBSCRIPTION, {
    variables: { id: ours.id },
  });

  const payload = gqlData(cancelResp)?.appSubscriptionCancel;
  const userErrors = payload?.userErrors ?? [];

  if (userErrors.length) {
    throw new Error(
      `Failed to cancel subscription: ${userErrors
        .map((e) => e.message)
        .join("; ")}`
    );
  }

  const status = payload?.appSubscription?.status ?? "CANCELLED";
  console.log(`Cancelled "${ours.name}" for ${session.shop} (status: ${status})`);

  return status;
}
