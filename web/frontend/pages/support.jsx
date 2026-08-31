import { Button, Page } from "@shopify/polaris";

import { FaqList, Section } from "../components";

// Set GLIDETOP_SUPPORT_EMAIL at build time to override. The fallback is a real
// monitored mailbox on purpose: Shopify requires a working support address to
// list the app, and a placeholder on a domain we don't own would silently ship
// a dead address if the build argument were ever missing.
const SUPPORT_EMAIL =
  process.env.GLIDETOP_SUPPORT_EMAIL || "ankur4worksabai@gmail.com";

const FAQ_ITEMS = [
  {
    q: "Will GlideTop slow my storefront down?",
    a: (
      <>
        <p>
          No. The button is a small block of inline CSS and JavaScript with no
          external libraries, no web fonts and no images — it adds roughly 4 KB
          to the page and loads nothing from a third-party host.
        </p>
        <p>
          Entitlement is fetched once and cached for the browsing session, so
          moving between pages costs no additional requests.
        </p>
      </>
    ),
  },
  {
    q: "Does it edit my theme files?",
    a: (
      <p>
        Never. GlideTop is a theme app embed, which Shopify injects at render
        time. Uninstalling the app removes the button completely and leaves no
        leftover markup, snippets or Liquid in your theme.
      </p>
    ),
  },
  {
    q: "Does it work with my theme?",
    a: (
      <p>
        It works with any Online Store 2.0 theme, which covers every theme in
        Shopify's theme store and almost all custom ones. If your theme predates
        2.0 and has no App embeds section in the editor, get in touch and we'll
        confirm.
      </p>
    ),
  },
  {
    q: "Is it accessible?",
    a: (
      <p>
        Yes. It renders a real <span className="gt-code">&lt;button&gt;</span>{" "}
        with a configurable screen-reader label and a visible focus outline, it
        honours <span className="gt-code">prefers-reduced-motion</span> by
        skipping the animation, and activating it moves keyboard focus to your
        main content rather than only moving the viewport.
      </p>
    ),
  },
  {
    q: "How does billing work?",
    a: (
      <p>
        Through Shopify's billing API, so charges appear on your normal Shopify
        invoice — we never see or store a card. Changing plans takes effect at
        once and Shopify prorates the difference. Cancelling drops you to the
        Free plan; the button keeps working on your home page.
      </p>
    ),
  },
  {
    q: "What happens to my settings if I downgrade?",
    a: (
      <p>
        Nothing is deleted. Your theme editor settings stay exactly as you left
        them, they simply stop being applied on a plan that doesn't include
        them. Re-subscribing restores your configuration immediately.
      </p>
    ),
  },
  {
    q: "What data does GlideTop collect?",
    a: (
      <p>
        Only what Shopify requires to run an app: your store domain and an
        access token, kept for session storage. GlideTop stores no customer
        data, sets no cookies and runs no analytics or tracking on your
        storefront.
      </p>
    ),
  },
];

export default function Support() {
  return (
    <Page
      fullWidth
      title="Help and support"
      subtitle="Most answers are below. If yours isn't, email us — we usually reply within one business day."
      primaryAction={
        <Button primary url={`mailto:${SUPPORT_EMAIL}`} external>
          Email support
        </Button>
      }
    >
      <Section
        title="Frequently asked"
        subtitle="The questions merchants ask before and just after installing."
      >
        <FaqList items={FAQ_ITEMS} />
      </Section>

      <Section
        title="Still stuck?"
        subtitle="Include your store domain and the theme you're using and we can usually answer in one reply."
      >
        <div className="gt-row">
          <Button primary url={`mailto:${SUPPORT_EMAIL}`} external>
            {SUPPORT_EMAIL}
          </Button>
        </div>

        <div className="gt-spacer" />
        <p className="gt-section__sub">
          If the button isn't appearing, tell us whether the app embed is toggled
          on in your <strong>live</strong> theme — that resolves the majority of
          reports on its own.
        </p>
      </Section>
    </Page>
  );
}
