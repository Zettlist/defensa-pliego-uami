import { createElement, useEffect, useId, useRef } from 'react';
import { IconChevron } from './icons.jsx';

/** Desplegable animado. Cerrado = inert (fuera del orden de tabulación), pero el texto sigue en el DOM. */
export default function Collapsible({ title, meta, open, onToggle, children, level = 3, className = '', hit = false, style }) {
  const id = useId();
  const bodyRef = useRef(null);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (open) el.removeAttribute('inert'); else el.setAttribute('inert', '');
  }, [open]);
  return (
    <section className={`fold ${open ? 'is-open' : ''} ${hit ? 'has-hit' : ''} ${className}`} style={style}>
      {createElement(
        `h${level}`,
        { className: 'fold-h' },
        <button type="button" className="fold-btn" id={id + 'b'} aria-expanded={open} aria-controls={id + 'r'} onClick={onToggle}>
          <span className="fold-title">{title}</span>
          {meta != null && <span className="fold-meta">{meta}</span>}
          {hit && <span className="fold-hit">coincide</span>}
          <span className="fold-chev-w" aria-hidden="true"><IconChevron className="fold-chev" /></span>
        </button>
      )}
      <div className="fold-body" id={id + 'r'} role="region" aria-labelledby={id + 'b'} aria-hidden={!open} ref={bodyRef}>
        <div className="fold-inner"><div className="fold-pad">{children}</div></div>
      </div>
    </section>
  );
}
