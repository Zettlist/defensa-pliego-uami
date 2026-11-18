import { useEffect, useRef } from 'react';
import { IconClose, IconExternal } from './icons.jsx';

function host(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; }
}

/** Panel lateral de una cita: frase exacta, por qué importa y botón al original. */
export default function CitePanel({ cite, citas, onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!cite) return;
    const prev = cite.trigger;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll('button, a[href]');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      if (prev && document.contains(prev)) prev.focus();
    };
  }, [cite, onClose]);

  if (!cite) return null;
  const d = citas[cite.k] || {};
  const isDrive = cite.s === 'drive';
  // Drive: si el enlace es de una carpeta, se dice; si es de un archivo, se abre el documento.
  // El visor de Drive no salta a una página, así que la página se indica en el texto.
  const isFolder = isDrive && /\/folders\//.test(cite.u || '');
  const btn = isFolder
    ? 'Abrir la carpeta del 23-oct en Google Drive'
    : isDrive
      ? (cite.p ? `Abrir el documento en Google Drive (ir a la página ${cite.p})` : 'Abrir el documento en Google Drive')
      : cite.p ? `Abrir el documento original en la página ${cite.p}` : 'Abrir el documento original';

  return (
    <div className="cite-layer">
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <aside className="cite-panel" role="dialog" aria-modal="true" aria-labelledby="cite-title" ref={panelRef}>
        <header className="cite-top">
          <div>
            <p className="eyebrow">Cita</p>
            <h2 id="cite-title" className="cite-id">{cite.id}</h2>
            <p className="cite-src">{cite.label}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} ref={closeRef} aria-label="Cerrar la cita (Esc)" title="Cerrar (Esc)">
            <IconClose width={18} height={18} />
          </button>
        </header>

        <section className="cite-sec">
          <h3 className="eyebrow">Frase exacta en el documento</h3>
          {d.p ? (
            <blockquote className="cite-quote"><span className="ell">…</span><mark>{d.p}</mark><span className="ell">…</span></blockquote>
          ) : (
            <p className="muted">Esta cita no tiene una frase registrada. Consulta el documento en la página indicada.</p>
          )}
        </section>

        <section className="cite-sec">
          <h3 className="eyebrow">Por qué importa</h3>
          <p className="cite-note">{d.n || 'Sin nota registrada.'}</p>
        </section>

        <div className="cite-actions">
          <a className="btn btn-primary" href={cite.u} target="_blank" rel="noopener noreferrer">
            <span>{btn}</span><IconExternal />
          </a>
          {cite.u && <p className="cite-host">{isDrive ? 'drive.google.com' : host(cite.u)} · se abre en otra pestaña</p>}
        </div>
      </aside>
    </div>
  );
}
