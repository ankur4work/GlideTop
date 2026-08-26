import { useState } from "react";
import {
  Banner,
  Button,
  Modal,
  Page,
  SkeletonBodyText,
  TextContainer,
  Toast,
} from "@shopify/polaris";
import { Redirect } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@shopify/app-bridge-react";

import { Section } from "../components";
import { usePlan } from "../hooks";
import { COMPARISON, PLANS, TIERS, planLabel } from "../lib/plans";

function Tick() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="4 12 10 18 20 6" />
    </svg>
  );
}

function Cross() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

const CONFIRM_COPY = {
  free: {
    title: "Move to the Free plan?",
    body: "This cancels your paid subscription immediately. Your button keeps working on the home page, but it reverts to GlideTop's default styling and any page-level visibility turns off.",
    cta: "Yes, cancel my plan",
  },
  basic: {
    title: "Switch to Basic?",
    body: "Basic unlocks every styling control — colours, hover state, icon, shape, size and position — with the button on your home page.",
    cta: "Subscribe for $10 / month",
  },
  premium: {
    title: "Upgrade to Premium?",
    body: "Premium adds the scroll-progress ring and lets you place the button on product, collection, page, blog and search templates.",
    cta: "Subscribe for $30 / month",
  },
};

export default function Pricing() {
  const app = useAppBridge();
  const { tier, loading, pending, error, setError, subscribe, cancel } = usePlan();

  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const openConfirm = (target) => {
    if (target === tier) {
      setToast(`You're already on the ${planLabel(target)} plan.`);
      return;
    }
    setConfirm(target);
  };

  const runConfirm = async () => {
    const target = confirm;
    setConfirm(null);
    if (!target) return;

    if (target === "free") {
      const status = await cancel();
      if (status && status !== "no-subscription") {
        setToast("Subscription cancelled. You're on the Free plan.");
      } else if (status === "no-subscription") {
        setToast("There was no active subscription to cancel.");
      }
      return;
    }

    const confirmationUrl = await subscribe(target);

    if (confirmationUrl) {
      setToast("Taking you to Shopify to confirm the charge…");
      Redirect.create(app).dispatch(Redirect.Action.REMOTE, confirmationUrl);
    } else if (!error) {
      setToast(`The ${planLabel(target)} plan is already active on your store.`);
    }
  };

  const ctaLabel = (id) => {
    if (tier === id) return "Current plan";
    if (id === "free") return "Downgrade to Free";
    if (tier === "premium" && id === "basic") return "Switch to Basic";
    return `Upgrade to ${PLANS[id].label}`;
  };

  return (
    <Page
      fullWidth
      title="Plans and billing"
      subtitle="Every plan is billed through Shopify and appears on your regular store invoice. Cancel any time."
    >
      {toast && <Toast content={toast} onDismiss={() => setToast(null)} />}

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm ? CONFIRM_COPY[confirm].title : ""}
        primaryAction={{
          content: confirm ? CONFIRM_COPY[confirm].cta : "",
          onAction: runConfirm,
          destructive: confirm === "free",
          loading: pending === confirm,
        }}
        secondaryActions={[{ content: "Go back", onAction: () => setConfirm(null) }]}
      >
        <Modal.Section>
          <TextContainer>
            <p>{confirm ? CONFIRM_COPY[confirm].body : ""}</p>
          </TextContainer>
        </Modal.Section>
      </Modal>

      {error && (
        <div style={{ marginBottom: 16 }}>
          <Banner status="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        </div>
      )}

      {loading ? (
        <Section title="Plans">
          <SkeletonBodyText lines={10} />
        </Section>
      ) : (
        <>
          <div className="gt-plans">
            {TIERS.map((id) => {
              const plan = PLANS[id];
              const isCurrent = tier === id;

              return (
                <article
                  key={id}
                  className={`gt-plan${isCurrent ? " gt-plan--current" : ""}`}
                >
                  <div className="gt-plan__accent" style={{ background: plan.accent }} />
                  {plan.ribbon && !isCurrent && (
                    <span className="gt-ribbon">{plan.ribbon}</span>
                  )}

                  <div className="gt-plan__body">
                    <div className="gt-plan__head">
                      <span className="gt-plan__name">{plan.label}</span>
                      {isCurrent && <span className="gt-pill gt-pill--plan">Current</span>}
                    </div>

                    <div className="gt-plan__price">
                      <span className="gt-plan__amount">${plan.price}</span>
                      <span className="gt-plan__period">
                        {plan.price === 0 ? "forever" : "/ month"}
                      </span>
                    </div>

                    <p className="gt-plan__pitch">{plan.pitch}</p>

                    <ul className="gt-plan__features">
                      {plan.features.map((f) => (
                        <li
                          key={f.text}
                          className={`gt-plan__feature ${f.on ? "is-on" : "is-off"}`}
                        >
                          {f.on ? <Tick /> : <Cross />}
                          <span>{f.text}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="gt-plan__cta">
                      <Button
                        fullWidth
                        primary={!isCurrent && id !== "free"}
                        destructive={!isCurrent && id === "free"}
                        disabled={isCurrent || pending !== null}
                        loading={pending === id}
                        onClick={() => openConfirm(id)}
                      >
                        {ctaLabel(id)}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="gt-spacer" />
          <div className="gt-spacer" />

          <Section
            title="Compare every feature"
            subtitle="The same information as above, laid out side by side."
          >
            <div className="gt-compare-wrap">
              <table className="gt-compare">
                <thead>
                  <tr>
                    <th scope="col">Feature</th>
                    <th scope="col">Free</th>
                    <th scope="col">Basic</th>
                    <th scope="col">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {TIERS.map((id) => (
                        <td key={id}>
                          <span
                            className={row[id] ? "is-on" : "is-off"}
                            aria-label={row[id] ? "Included" : "Not included"}
                          >
                            {row[id] ? "✓" : "—"}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="gt-spacer" />
            <div className="gt-note">
              <div>
                Changing plans takes effect immediately. Shopify prorates the
                difference on your next invoice, so upgrading mid-cycle never
                charges you twice.
              </div>
            </div>
          </Section>
        </>
      )}
    </Page>
  );
}
