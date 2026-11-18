import { createElement, useLayoutEffect, useRef } from 'react';
import { highlight } from '../lib.js';

/** Inserta HTML de data.json y resalta los términos buscados. */
export default function Rich({ html, as = 'div', className, terms }) {
  const ref = useRef(null);
  const key = (terms || []).join('\u0001');
  useLayoutEffect(() => {
    highlight(ref.current, terms);
  }, [html, key]); // eslint-disable-line react-hooks/exhaustive-deps
  return createElement(as, { ref, className, dangerouslySetInnerHTML: { __html: html || '' } });
}

/** Texto plano resaltado (para campos que no son HTML). */
export function Hl({ text, terms, as = 'span', className }) {
  const ref = useRef(null);
  const key = (terms || []).join('\u0001');
  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.textContent = text ?? '';
    highlight(ref.current, terms);
  }, [text, key]); // eslint-disable-line react-hooks/exhaustive-deps
  return createElement(as, { ref, className });
}
