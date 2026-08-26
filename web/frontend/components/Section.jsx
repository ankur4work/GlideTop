/**
 * The standard GlideTop content container: gradient rule, title, optional
 * subtitle and a trailing action slot.
 */
export function Section({ title, subtitle, action, children }) {
  return (
    <section className="gt-section">
      <div className="gt-section__head">
        <div>
          <div className="gt-rule" />
          <h2 className="gt-section__title">{title}</h2>
          {subtitle && <p className="gt-section__sub">{subtitle}</p>}
        </div>
        {action && <div className="gt-row">{action}</div>}
      </div>
      <div className="gt-section__body">{children}</div>
    </section>
  );
}
