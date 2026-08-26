/**
 * Plan metadata shared by the dashboard and the pricing page.
 *
 * The backend now speaks the same three tier names the UI does
 * ("free" | "basic" | "premium"), so nothing here needs remapping.
 */

export const TIERS = ["free", "basic", "premium"];

export const PLANS = {
  free: {
    id: "free",
    label: "Free",
    price: 0,
    accent: "linear-gradient(90deg, #94A3B8 0%, #64748B 100%)",
    pitch:
      "A polished back-to-top button on your home page, styled in GlideTop's own palette.",
    ribbon: null,
    features: [
      { text: "Animated scroll back to top", on: true },
      { text: "Progress ring on the button", on: false },
      { text: "Your colours, icon and shape", on: false },
      { text: "Show on product and collection pages", on: false },
      { text: "Position, size and offset controls", on: false },
    ],
  },
  basic: {
    id: "basic",
    label: "Basic",
    price: 10,
    accent: "linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)",
    pitch:
      "Full control of how the button looks, so it reads as part of your brand rather than an add-on.",
    ribbon: "Popular",
    features: [
      { text: "Animated scroll back to top", on: true },
      { text: "Progress ring on the button", on: false },
      { text: "Your colours, icon and shape", on: true },
      { text: "Show on product and collection pages", on: false },
      { text: "Position, size and offset controls", on: true },
    ],
  },
  premium: {
    id: "premium",
    label: "Premium",
    price: 30,
    accent: "linear-gradient(90deg, #4F46E5 0%, #06B6D4 100%)",
    pitch:
      "Everything in Basic, plus the scroll-progress ring and the button on every page type you choose.",
    ribbon: null,
    features: [
      { text: "Animated scroll back to top", on: true },
      { text: "Progress ring on the button", on: true },
      { text: "Your colours, icon and shape", on: true },
      { text: "Show on product and collection pages", on: true },
      { text: "Position, size and offset controls", on: true },
    ],
  },
};

/** Rows for the side-by-side comparison table. */
export const COMPARISON = [
  { label: "Animated scroll back to top", free: true, basic: true, premium: true },
  { label: "Works on mobile and desktop", free: true, basic: true, premium: true },
  { label: "Home page", free: true, basic: true, premium: true },
  { label: "Custom colours and hover state", free: false, basic: true, premium: true },
  { label: "Six icon styles and three shapes", free: false, basic: true, premium: true },
  { label: "Button size, corner and offsets", free: false, basic: true, premium: true },
  { label: "Text label beside the icon", free: false, basic: true, premium: true },
  { label: "Product and collection pages", free: false, basic: false, premium: true },
  { label: "Pages, blogs and search", free: false, basic: false, premium: true },
  { label: "Scroll-progress ring", free: false, basic: false, premium: true },
];

export const planLabel = (tier) => PLANS[tier]?.label ?? "Free";
