import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Estado de los desplegables de una vista.
 * Mientras hay búsqueda, se abren exactamente los que tienen coincidencias.
 */
export default function useFolds(allKeys, matchKeys, termsKey) {
  const [open, setOpen] = useState(() => new Set(termsKey ? matchKeys : []));
  const first = useRef(true);
  const matchStr = matchKeys.join('|');

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setOpen(new Set(termsKey ? matchKeys : []));
  }, [termsKey, matchStr]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback((k) => setOpen((s) => {
    const n = new Set(s);
    n.has(k) ? n.delete(k) : n.add(k);
    return n;
  }), []);
  const openAll = useCallback(() => setOpen(new Set(allKeys)), [allKeys.join('|')]); // eslint-disable-line
  const closeAll = useCallback(() => setOpen(new Set()), []);
  return { isOpen: (k) => open.has(k), toggle, openAll, closeAll };
}
