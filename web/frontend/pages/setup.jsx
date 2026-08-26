import { useCallback, useState } from "react";
import { Banner, Button, Page } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

import { Section } from "../components";
import { useAuthenticatedFetch } from "../hooks";

const STEPS = [
  {
    title: "Open your theme editor",
    text: "Use the button above, or go to Online Store → Themes → Customize on the theme you want GlideTop on. Only the theme you edit gets the button.",
  },
  {
    title: "Find App embeds",
    text: "In the left sidebar of the editor, click the App embeds icon (the jigsaw piece) at the bottom. GlideTop appears in that list.",
  },
  {
    title: "Toggle GlideTop on",
    text: "Flip the switch next to GlideTop. The button appears in the preview straight away — scroll the preview to bring it in.",
  },
  {
    title: "Style it",
    text: "Expand the GlideTop entry to reach every setting: icon, shape, size, colours, corner, offsets, scroll threshold and per-template visibility.",
  },
  {
    title: "Save",
    text: "Click Save in the top right. Nothing is live on your storefront until you do.",
  },
];

const TROUBLESHOOTING = [
  {
    title: "The button isn't showing on my storefront",
    text: "Check that you saved the theme editor, that you edited your live theme rather than a draft, and that you've scrolled past the threshold (200px by default).",
  },
  {
    title: "It only shows on my home page",
    text: "That's the Free and Basic behaviour. Page-level visibility is a Premium feature — the per-template toggles are ignored on lower plans.",
  },
  {
    title: "My colours aren't being applied",
    text: "The Free plan renders GlideTop's own indigo styling and ignores your colour settings. Basic and Premium apply them.",
  },
  {
    title: "It overlaps my chat widget",
    text: "Raise Distance from bottom in the app embed settings, or move GlideTop to the opposite corner.",
  },
  {
    title: "I changed plans but nothing changed on the storefront",
    text: "Entitlement is cached in the shopper's browser for ten minutes to keep the storefront fast. Open a new private window to see the change immediately.",
  },
];

export default function Setup() {
  const navigate = useNavigate();
  const fetchAuth = useAuthenticatedFetch();

  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(null);

  const openThemeEditor = useCallback(async () => {
    setOpening(true);
    setError(null);

    try {
      const res = await fetchAuth("/api/shop");
      if (!res.ok) throw new Error("We couldn't detect your store domain.");

      const data = await res.json();
      if (!data?.domain) throw new Error("We couldn't detect your store domain.");

      const uuid = process.env.GLIDETOP_EXTENSION_UUID;
      const target = uuid
        ? `https://${data.domain}/admin/themes/current/editor?context=apps&activateAppId=${uuid}/glidetop`
        : `https://${data.domain}/admin/themes/current/editor?context=apps`;

      window.open(target, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e.message || "We couldn't open the theme editor.");
    } finally {
      setOpening(false);
    }
  }, [fetchAuth]);

  return (
    <Page
      fullWidth
      title="Setup guide"
      subtitle="About two minutes, entirely inside your theme editor. No code, no theme file changes."
      primaryAction={
        <Button primary loading={opening} onClick={openThemeEditor}>
          Open theme editor
        </Button>
      }
    >
      {error && (
        <div style={{ marginBottom: 16 }}>
          <Banner status="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        </div>
      )}

      <Section
        title="Turning GlideTop on"
        subtitle="GlideTop ships as a theme app embed, so it installs and uninstalls cleanly without editing any theme files."
      >
        <ol className="gt-steps">
          {STEPS.map((step, index) => (
            <li className="gt-step gt-step--active" key={step.title}>
              <span className="gt-step__marker">{index + 1}</span>
              <div>
                <p className="gt-step__title">{step.title}</p>
                <p className="gt-step__text">{step.text}</p>
              </div>
              <div />
            </li>
          ))}
        </ol>

        <div className="gt-spacer" />
        <div className="gt-note">
          <div>
            Switching themes later? App embeds are per-theme, so repeat these
            steps on the new theme before you publish it.
          </div>
        </div>
      </Section>

      <Section
        title="If something looks wrong"
        subtitle="The five things that account for almost every support request."
      >
        <ol className="gt-steps">
          {TROUBLESHOOTING.map((item) => (
            <li className="gt-step" key={item.title}>
              <span className="gt-step__marker">?</span>
              <div>
                <p className="gt-step__title">{item.title}</p>
                <p className="gt-step__text">{item.text}</p>
              </div>
              <div />
            </li>
          ))}
        </ol>

        <div className="gt-spacer" />
        <div className="gt-row">
          <Button onClick={() => navigate("/support")}>Contact support</Button>
          <Button plain onClick={() => navigate("/pricing")}>
            Compare plans
          </Button>
        </div>
      </Section>
    </Page>
  );
}
