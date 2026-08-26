import { useCallback, useEffect, useState } from "react";
import { Banner, Button, Page, SkeletonBodyText, Spinner } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

import { ButtonPreview, Section } from "../components";
import { useAuthenticatedFetch, usePlan } from "../hooks";
import { planLabel } from "../lib/plans";

/* --------------------------------- Icons --------------------------------- */

const TILE_ICONS = {
  motion: (
    <svg viewBox="0 0 24 24">
      <path d="M12 20V6" />
      <polyline points="6 12 12 6 18 12" />
    </svg>
  ),
  ring: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  ),
  brush: (
    <svg viewBox="0 0 24 24">
      <path d="M4 20c2 0 3-1 3-3 0-1.2-.8-2-2-2s-2 .8-2 2c0 1-.5 2-1 2Z" />
      <path d="M8.5 15.5 19 5a2 2 0 0 0-3-3L5.5 12.5" />
    </svg>
  ),
  pages: (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="4" width="14" height="16" rx="2" />
      <path d="M21 7v11a3 3 0 0 1-3 3H7" />
    </svg>
  ),
  speed: (
    <svg viewBox="0 0 24 24">
      <path d="M13 2 4 14h7l-1 8 9-12h-7Z" />
    </svg>
  ),
  a11y: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="2" />
      <path d="M5 9h14M12 9v5m0 0-3 6m3-6 3 6" />
    </svg>
  ),
};

const FEATURES = [
  {
    icon: "motion",
    title: "Momentum-eased return",
    text: "A spring-weighted glide back to the top instead of an abrupt jump, with a reduced-motion fallback built in.",
  },
  {
    icon: "ring",
    title: "Scroll-progress ring",
    text: "The button doubles as a reading indicator, filling as the shopper moves down a long collection or article.",
  },
  {
    icon: "brush",
    title: "Six icons, three shapes",
    text: "Circle, squircle or rounded square, with independent background, hover, icon and ring colours.",
  },
  {
    icon: "pages",
    title: "Per-template visibility",
    text: "Decide separately whether it shows on home, product, collection, and content templates.",
  },
  {
    icon: "speed",
    title: "One request per session",
    text: "Entitlement is cached in the browser, so browsing twenty pages costs a single call — not twenty.",
  },
  {
    icon: "a11y",
    title: "Keyboard and screen reader ready",
    text: "A real button element with a visible focus ring, a configurable label, and focus moved to your main content on activation.",
  },
];

/* --------------------------------- Page ---------------------------------- */

export default function Dashboard() {
  const navigate = useNavigate();
  const fetchAuth = useAuthenticatedFetch();
  const { tier, loading, error, setError } = usePlan();

  const [shop, setShop] = useState(null);
  const [opening, setOpening] = useState(false);
  const [themeError, setThemeError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchAuth("/api/shop")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setShop(data);
      })
      .catch(() => {
        /* the dashboard renders fine without the shop name */
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openThemeEditor = useCallback(async () => {
    setOpening(true);
    setThemeError(null);

    try {
      let domain = shop?.domain;

      if (!domain) {
        const res = await fetchAuth("/api/shop");
        if (!res.ok) throw new Error("We couldn't detect your store domain.");
        const data = await res.json();
        domain = data?.domain;
      }

      if (!domain) throw new Error("We couldn't detect your store domain.");

      // The extension UUID is baked in at build time. Without it we can still
      // drop the merchant on the App embeds panel — they just toggle GlideTop
      // on manually rather than it being pre-selected.
      const uuid = process.env.GLIDETOP_EXTENSION_UUID;
      const target = uuid
        ? `https://${domain}/admin/themes/current/editor?context=apps&activateAppId=${uuid}/glidetop`
        : `https://${domain}/admin/themes/current/editor?context=apps`;

      window.open(target, "_blank", "noopener,noreferrer");
    } catch (e) {
      setThemeError(e.message || "We couldn't open the theme editor.");
    } finally {
      setOpening(false);
    }
  }, [shop, fetchAuth]);

  const isPaid = tier === "basic" || tier === "premium";

  const steps = [
    {
      state: "done",
      marker: "✓",
      title: "GlideTop is installed",
      text: shop?.name
        ? `Connected to ${shop.name}.`
        : "Your store is connected and ready.",
    },
    {
      state: isPaid ? "done" : "active",
      marker: isPaid ? "✓" : "2",
      title: isPaid ? `You're on the ${planLabel(tier)} plan` : "Choose your plan",
      text: isPaid
        ? "Every styling control unlocked by this plan is available in the theme editor."
        : "The Free plan shows a fixed button on your home page. Upgrade to style it or show it everywhere.",
      action: isPaid ? null : (
        <Button onClick={() => navigate("/pricing")}>Compare plans</Button>
      ),
    },
    {
      state: "active",
      marker: "3",
      title: "Turn on the app embed",
      text: "GlideTop only appears once its app embed is enabled in your live theme. This is the last step.",
      action: (
        <Button primary loading={opening} onClick={openThemeEditor}>
          Open theme editor
        </Button>
      ),
    },
  ];

  return (
    <Page fullWidth>
      {/* ------------------------------- Hero ------------------------------- */}
      <div className="gt-hero">
        <div className="gt-hero__inner">
          <div>
            <p className="gt-hero__eyebrow">GlideTop</p>
            <h1 className="gt-hero__title">Give long pages a way back up</h1>
            <p className="gt-hero__text">
              A floating back-to-top control that matches your storefront, tracks
              reading progress, and stays out of the way until a shopper actually
              needs it.
            </p>
          </div>

          <div className="gt-hero__actions">
            {loading ? (
              <span className="gt-pill gt-pill--onHero">
                <Spinner size="small" />
                Checking plan
              </span>
            ) : (
              <span className="gt-pill gt-pill--onHero">
                <span className="gt-pill__dot" />
                {planLabel(tier)} plan
              </span>
            )}
            <Button primary loading={opening} onClick={openThemeEditor}>
              Open theme editor
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16 }}>
          <Banner status="warning" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        </div>
      )}

      {themeError && (
        <div style={{ marginBottom: 16 }}>
          <Banner status="critical" onDismiss={() => setThemeError(null)}>
            {themeError}
          </Banner>
        </div>
      )}

      {/* ----------------------------- Checklist ---------------------------- */}
      <Section
        title="Finish setting up"
        subtitle="Three steps, and the last one is the only one that puts the button on your storefront."
      >
        {loading ? (
          <SkeletonBodyText lines={6} />
        ) : (
          <ol className="gt-steps">
            {steps.map((step) => (
              <li key={step.title} className={`gt-step gt-step--${step.state}`}>
                <span className="gt-step__marker">{step.marker}</span>
                <div>
                  <p className="gt-step__title">{step.title}</p>
                  <p className="gt-step__text">{step.text}</p>
                </div>
                <div>{step.action}</div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* ------------------------------ Preview ----------------------------- */}
      <Section
        title="Try it before you style it"
        subtitle="Scroll the frame to watch the button arrive, then click it to glide back."
        action={<Button onClick={() => navigate("/setup")}>Setup guide</Button>}
      >
        <ButtonPreview showProgress={tier === "premium"} />
      </Section>

      {/* ------------------------------ Features ---------------------------- */}
      <Section
        title="What's included"
        subtitle="Everything GlideTop does, and which plan it needs."
      >
        <div className="gt-grid">
          {FEATURES.map((f) => (
            <article className="gt-tile" key={f.title}>
              <div className="gt-tile__icon">{TILE_ICONS[f.icon]}</div>
              <h3 className="gt-tile__title">{f.title}</h3>
              <p className="gt-tile__text">{f.text}</p>
            </article>
          ))}
        </div>

        {!loading && tier !== "premium" && (
          <>
            <div className="gt-spacer" />
            <div className="gt-note">
              <div>
                <strong>
                  {tier === "free"
                    ? "You're on the Free plan."
                    : "You're on the Basic plan."}
                </strong>{" "}
                {tier === "free"
                  ? "Styling controls and page-level visibility are locked."
                  : "The progress ring and non-home pages are locked."}{" "}
                <Button plain onClick={() => navigate("/pricing")}>
                  See what upgrading adds
                </Button>
              </div>
            </div>
          </>
        )}
      </Section>
    </Page>
  );
}
