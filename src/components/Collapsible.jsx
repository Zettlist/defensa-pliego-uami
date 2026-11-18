import { createElement, useId } from 'react';
import { IconChevron } from './icons.jsx';

export default function Collapsible({ title, meta, open, onToggle, children, level = 3, className = '', hit = false }) {
  const id = useId();
  return (
    <section className={`fold ${open ? 'is-open' : ''} ${hit ? 'has-hit' : ''} ${className}`}>
      {createElement(
        `h${level}`,
        { className: 'fold-h' },
        <button type="button" className="fold-btn" id={id + 'b'} aria-expanded={open} aria-controls={id + 'r'} onClick={onToggle}>
          <span className="fold-title">{title}</span>
          {meta != null && <span className="fold-meta">{meta}</span>}
          {hit && <span className="fold-hit">coincide</span>}
          <IconChevron className="fold-chev" />
        </button>
      )}
      <div className="fold-body" id={id + 'r'} role="region" aria-labelledby={id + 'b'} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
