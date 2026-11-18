import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar, MobileNav } from './components/Nav.jsx';
import { Overview, Point, Debilidades, Verificacion, Glosario, Advertencias } from './components/views.jsx';
import CitePanel from './components/CitePanel.jsx';
import { IconClose, IconSearch } from './components/icons.jsx';
import { VIEWS, buildIndex, countMatches, ejeLabel, parseHash, slug, termsOf } from './lib.js';

const MESA_KEY = 'defensa-pliego.mesa';
const readMesa = () => { try { return localStorage.getItem(MESA_KEY) === '1'; } catch { return false; } };

export default function App({ data }) {
  const [route, setRoute] = useState(() => parseHash(data.ejes));
  const [q, setQ] = useState('');
  const [mesa, setMesa] = useState(readMesa);
  const [cite, setCite] = useState(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const searchRef = useRef(null);
  const headRef = useRef(null);
  const firstRoute = useRef(true);

  const ix = useMemo(() => buildIndex(data), [data]);
  const dq = useDeferredValue(q);
  const terms = useMemo(() => termsOf(dq), [dq]);

  const e = data.ejes.find((x) => x.id === route.eje) || data.ejes[0];
  const eix = ix[e.id];
  const other = data.ejes.find((x) => x.id !== e.id);
  const counts = useMemo(() => countMatches(eix, terms), [eix, terms]);
  const otherCounts = useMemo(() => (other ? countMatches(ix[other.id], terms) : null), [ix, other, terms]);
  const pIdx = e.puntos.findIndex((p) => slug(p.pid) === route.view);

  // Ruteo por hash
  useEffect(() => {
    const on = () => setRoute(parseHash(data.ejes));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, [data]);
  const go = useCallback((view, eje = e.id) => { window.location.hash = `${eje}-${view}`; }, [e.id]);

  // Al cambiar de vista: arriba y foco en el título (no en la primera carga)
  useEffect(() => {
    const p = pIdx > -1 ? e.puntos[pIdx] : null;
    const v = VIEWS.find((x) => x.id === route.view);
    document.title = `${p ? p.pid + ' · ' : v && v.id !== 'inicio' ? v.label + ' · ' : ''}${ejeLabel(e)} · Defensa del pliego UAMI`;
    if (firstRoute.current) { firstRoute.current = false; return; }
    window.scrollTo(0, 0);
    headRef.current?.focus({ preventScroll: true });
  }, [route.eje, route.view]); // eslint-disable-line react-hooks/exhaustive-deps

  // Modo mesa
  useEffect(() => {
    document.documentElement.classList.toggle('mesa', mesa);
    try { localStorage.setItem(MESA_KEY, mesa ? '1' : '0'); } catch { /* sin almacenamiento */ }
  }, [mesa]);

  useEffect(() => {
    const up = () => setOnline(true), down = () => setOnline(false);
    window.addEventListener('online', up); window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  // Citas: delegación de clics sobre <button class="cite"> que viene en el HTML de data.json
  const onClick = useCallback((ev) => {
    const b = ev.target.closest('button.cite');
    if (!b) return;
    ev.preventDefault();
    setCite({
      k: b.dataset.k, u: b.dataset.u, s: b.dataset.s, p: b.dataset.p,
      id: b.querySelector('b')?.textContent || b.dataset.k,
      label: b.querySelector('span')?.textContent || '',
      trigger: b,
    });
  }, []);
  const closeCite = useCallback(() => setCite(null), []);

  // Atajos: "/" busca; flechas = punto anterior/siguiente
  useEffect(() => {
    const onKey = (ev) => {
      if (cite || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const tag = (ev.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || ev.target.isContentEditable) return;
      if (ev.key === '/') { ev.preventDefault(); searchRef.current?.focus(); searchRef.current?.select(); }
      else if (pIdx > -1 && ev.key === 'ArrowLeft' && e.puntos[pIdx - 1]) go(slug(e.puntos[pIdx - 1].pid));
      else if (pIdx > -1 && ev.key === 'ArrowRight' && e.puntos[pIdx + 1]) go(slug(e.puntos[pIdx + 1].pid));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cite, pIdx, e, go]);

  const common = { data, e, ix: eix, terms, headRef };
  let main;
  if (pIdx > -1) main = <Point key={e.id + route.view} {...common} idx={pIdx} mesa={mesa} />;
  else if (route.view === 'debilidades') main = <Debilidades key={e.id + route.view} {...common} />;
  else if (route.view === 'verificacion') main = <Verificacion key={e.id + route.view} {...common} />;
  else if (route.view === 'glosario') main = <Glosario key={e.id + route.view} {...common} />;
  else if (route.view === 'advertencias') main = <Advertencias key={e.id + route.view} {...common} />;
  else main = <Overview key={e.id + 'inicio'} {...common} />;

  const searching = terms.length > 0;
  const qShown = dq.trim();

  return (
    <div className="app" onClick={onClick}>
      <a className="skip" href="#contenido" onClick={(ev) => { ev.preventDefault(); headRef.current?.focus(); }}>Saltar al contenido</a>
      <header className="top">
        <div className="top-in">
          <a className="brand" href={`#${e.id}-inicio`}>
            <span className="brand-t">Defensa del pliego petitorio</span>
            <span className="brand-s">UAM Iztapalapa · Mesa del {data.mesa} · Actualizado {data.fecha}</span>
          </a>

          <div className="seg" role="group" aria-label="Eje">
            {data.ejes.map((x) => (
              <button key={x.id} type="button" aria-pressed={x.id === e.id} title={x.title}
                onClick={() => go('inicio', x.id)}>
                {ejeLabel(x)}
              </button>
            ))}
          </div>

          <div className="search" role="search">
            <IconSearch className="search-ic" />
            <label htmlFor="q" className="sr-only">Buscar en el {ejeLabel(e)}</label>
            <input id="q" ref={searchRef} type="search" autoComplete="off" spellCheck="false"
              placeholder={`Buscar en el ${ejeLabel(e)}`} value={q}
              onChange={(ev) => setQ(ev.target.value)}
              onKeyDown={(ev) => { if (ev.key === 'Escape') setQ(''); }} />
            {searching ? (
              <button type="button" className="icon-btn sm" onClick={() => { setQ(''); searchRef.current?.focus(); }} aria-label="Borrar búsqueda"><IconClose /></button>
            ) : <kbd className="search-k" aria-hidden="true">/</kbd>}
          </div>

          <button type="button" className="switch" role="switch" aria-checked={mesa} onClick={() => setMesa((m) => !m)}
            title="Solo exigencia, mínimo, réplica y criterios, en letra grande">
            <span className="switch-trk" aria-hidden="true"><span className="switch-dot" /></span>
            <span>Modo mesa</span>
          </button>
        </div>
      </header>

      <MobileNav e={e} view={route.view} onGo={(v) => go(v)} />

      {!online && <p className="banner banner-off">Sin conexión. Se muestra la última versión guardada en este dispositivo.</p>}
      {searching && (
        <p className="banner banner-search" aria-live="polite">
          {counts.total === 0
            ? <>Sin coincidencias para «{qShown}» en el {ejeLabel(e)}.</>
            : <>«{qShown}» en el {ejeLabel(e)}: {counts.puntos} {counts.puntos === 1 ? 'punto' : 'puntos'} · {counts.deb} {counts.deb === 1 ? 'debilidad' : 'debilidades'} · {counts.glos} en glosario · {counts.adv} {counts.adv === 1 ? 'advertencia' : 'advertencias'}.</>}
          {other && otherCounts?.total > 0 && <> <a href={`#${other.id}-inicio`}>Ver {otherCounts.total} en el {ejeLabel(other)}</a></>}
        </p>
      )}

      <div className="layout">
        <Sidebar e={e} ix={eix} view={route.view} terms={terms} counts={counts} other={other} otherCounts={otherCounts} />
        <main id="contenido" className="main">{main}</main>
      </div>

      <footer className="foot">
        <p>Haz clic en una cita (R1, D4, N2…) para ver la frase exacta y abrir el documento original en la página citada. Las citas con flecha son fuentes de internet y se abren directo en otra pestaña.</p>
        <p className="foot-k">Atajos: <kbd>/</kbd> buscar · <kbd>←</kbd> <kbd>→</kbd> punto anterior o siguiente · <kbd>Esc</kbd> cerrar la cita.</p>
      </footer>

      <CitePanel cite={cite} citas={data.citas} onClose={closeCite} />
    </div>
  );
}
