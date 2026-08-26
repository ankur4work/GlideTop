import { useState } from "react";

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * @param {{ items: { q: string, a: React.ReactNode }[] }} props
 */
export function FaqList({ items }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="gt-faq">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `gt-faq-panel-${index}`;

        return (
          <div className="gt-faq__item" key={item.q}>
            <button
              type="button"
              className="gt-faq__q"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <span>{item.q}</span>
              <Chevron />
            </button>
            {isOpen && (
              <div className="gt-faq__a" id={panelId}>
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
