import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlideIcon, ICON_OPTIONS } from "./GlideIcon";

const SWATCHES = [
  { value: "#4F46E5", hover: "#3730A3", label: "Indigo" },
  { value: "#06B6D4", hover: "#0E7490", label: "Cyan" },
  { value: "#0F172A", hover: "#334155", label: "Slate" },
  { value: "#DB2777", hover: "#9D174D", label: "Pink" },
  { value: "#059669", hover: "#047857", label: "Emerald" },
  { value: "#EA580C", hover: "#C2410C", label: "Orange" },
];

const SHAPES = [
  { value: "circle", label: "Circle", radius: "50%" },
  { value: "squircle", label: "Squircle", radius: "30%" },
  { value: "square", label: "Square", radius: "14px" },
];

const RING_RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * A miniature storefront the merchant can actually scroll, so they can see how
 * GlideTop behaves before touching the theme editor.
 *
 * This deliberately mirrors the markup and timings of the real theme extension
 * — if the two drift apart, the preview stops being trustworthy.
 */
export function ButtonPreview({ showProgress = true }) {
  const [color, setColor] = useState(SWATCHES[0]);
  const [shape, setShape] = useState(SHAPES[0]);
  const [icon, setIcon] = useState(ICON_OPTIONS[0].value);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const scrollRef = useRef(null);
  const frameRef = useRef(null);

  const readScroll = useCallback(() => {
    frameRef.current = null;

    const el = scrollRef.current;
    if (!el) return;

    const scrollable = el.scrollHeight - el.clientHeight;
    setVisible(el.scrollTop > 60);
    setProgress(scrollable > 0 ? Math.min(1, Math.max(0, el.scrollTop / scrollable)) : 0);
  }, []);

  const onScroll = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(readScroll);
  }, [readScroll]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    },
    []
  );

  const scrollBackToTop = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filler = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="gt-stack">
          <div className="gt-skeleton gt-skeleton--title" />
          <div className="gt-skeleton gt-skeleton--line" />
          <div className="gt-skeleton gt-skeleton--line is-short" />
          <div className="gt-skeleton gt-skeleton--card" />
        </div>
      )),
    []
  );

  const sampleStyle = {
    width: 52,
    height: 52,
    right: 16,
    bottom: 16,
    borderRadius: shape.radius,
    backgroundColor: hovered ? color.hover : color.value,
  };

  return (
    <div className="gt-preview">
      <div className="gt-preview__controls">
        <div>
          <span className="gt-field__label">Colour</span>
          <div className="gt-swatches">
            {SWATCHES.map((s) => (
              <button
                key={s.value}
                type="button"
                className="gt-swatch"
                style={{ backgroundColor: s.value }}
                aria-pressed={color.value === s.value}
                aria-label={s.label}
                title={s.label}
                onClick={() => setColor(s)}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="gt-field__label">Shape</span>
          <div className="gt-chips">
            {SHAPES.map((s) => (
              <button
                key={s.value}
                type="button"
                className="gt-chip"
                aria-pressed={shape.value === s.value}
                onClick={() => setShape(s)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="gt-field__label">Icon</span>
          <div className="gt-chips">
            {ICON_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className="gt-chip"
                aria-pressed={icon === o.value}
                onClick={() => setIcon(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <p className="gt-plan__pitch" style={{ minHeight: 0 }}>
          These controls preview the look only. The live button is configured in
          your theme editor, where the same options appear under the GlideTop app
          embed.
        </p>
      </div>

      <div>
        <div className="gt-stage">
          <div className="gt-stage__scroll" ref={scrollRef} onScroll={onScroll}>
            <div className="gt-stage__bar">
              <span className="gt-stage__dot" />
              <span className="gt-stage__dot" />
              <span className="gt-stage__dot" />
            </div>
            <div className="gt-stage__content">{filler}</div>
          </div>

          <button
            type="button"
            className={`gt-sample${visible ? " is-visible" : ""}`}
            style={sampleStyle}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={scrollBackToTop}
            aria-label="Back to top"
          >
            {showProgress && shape.value === "circle" && (
              <svg className="gt-sample__ring" viewBox="0 0 100 100" aria-hidden="true">
                <circle
                  cx="50"
                  cy="50"
                  r={RING_RADIUS}
                  stroke="#FFFFFF"
                  opacity="0.28"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={RING_RADIUS}
                  stroke="#FFFFFF"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                />
              </svg>
            )}
            <GlideIcon name={icon} />
          </button>
        </div>

        <p className="gt-hint">Scroll inside the frame to bring the button in.</p>
      </div>
    </div>
  );
}
