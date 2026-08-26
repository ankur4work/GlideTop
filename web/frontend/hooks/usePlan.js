import { useCallback, useEffect, useState } from "react";
import { useAuthenticatedFetch } from "./useAuthenticatedFetch";

/**
 * Reads the shop's current tier and exposes subscribe / cancel actions.
 *
 * Both pages that touch billing use this, so the "which tier am I on" logic
 * lives in exactly one place.
 */
export function usePlan() {
  const fetchAuth = useAuthenticatedFetch();

  const [tier, setTier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAuth("/api/plan");
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || "Could not read your plan");

      setTier(["free", "basic", "premium"].includes(data?.tier) ? data.tier : "free");
      setError(null);
    } catch (e) {
      console.error(e);
      setTier("free");
      setError("We couldn't load your subscription, so we're showing the Free plan.");
    } finally {
      setLoading(false);
    }
    // fetchAuth is rebuilt every render by the App Bridge helper; depending on
    // it here would restart the request forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Start a subscription. Resolves to a confirmation URL the caller must
   * redirect to, or null when the plan was already active.
   */
  const subscribe = useCallback(
    async (target) => {
      setPending(target);
      setError(null);
      try {
        const res = await fetchAuth(`/api/plan/subscribe?plan=${target}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data?.error || "Could not start the subscription");

        if (data?.alreadyActive) {
          await refresh();
          return null;
        }

        if (!data?.confirmationUrl) {
          throw new Error("Shopify did not return a billing confirmation URL");
        }

        return String(data.confirmationUrl);
      } catch (e) {
        console.error(e);
        setError("We couldn't start the subscription. Please try again.");
        return null;
      } finally {
        setPending(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refresh]
  );

  const cancel = useCallback(async () => {
    setPending("free");
    setError(null);
    try {
      const res = await fetchAuth("/api/plan/cancel");
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || "Could not cancel");

      await refresh();
      return data?.status ?? "no-subscription";
    } catch (e) {
      console.error(e);
      setError("We couldn't cancel your subscription. Please try again.");
      return null;
    } finally {
      setPending(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  return { tier, loading, pending, error, setError, refresh, subscribe, cancel };
}
