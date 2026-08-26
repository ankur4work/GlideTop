/**
 * The GlideTop icon set.
 *
 * These paths are duplicated in extensions/glidetop/blocks/glidetop.liquid —
 * the theme extension cannot import from the React bundle. Keep the two in
 * sync so the admin preview matches what shoppers actually see.
 */
export const ICON_OPTIONS = [
  { value: "chevron", label: "Chevron" },
  { value: "arrow", label: "Arrow" },
  { value: "double_chevron", label: "Double" },
  { value: "chevron_line", label: "Bar" },
  { value: "triangle", label: "Triangle" },
  { value: "rocket", label: "Rocket" },
];

export function GlideIcon({ name }) {
  switch (name) {
    case "arrow":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      );

    case "double_chevron":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="6 17 12 11 18 17" />
          <polyline points="6 11 12 5 18 11" />
        </svg>
      );

    case "chevron_line":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="5" y1="5" x2="19" y2="5" />
          <polyline points="6 17 12 11 18 17" />
        </svg>
      );

    case "triangle":
      return (
        <svg viewBox="0 0 24 24" className="is-filled" aria-hidden="true">
          <path d="M12 6 20 17H4Z" />
        </svg>
      );

    case "rocket":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2c3 2.4 4.5 5.6 4.5 9v4.5h-9V11c0-3.4 1.5-6.6 4.5-9Z" />
          <path d="M7.5 15.5 5 18l2 1 1 2 2.5-2.5" />
          <path d="M16.5 15.5 19 18l-2 1-1 2-2.5-2.5" />
          <circle cx="12" cy="10" r="1.6" />
        </svg>
      );

    case "chevron":
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="6 15 12 9 18 15" />
        </svg>
      );
  }
}
