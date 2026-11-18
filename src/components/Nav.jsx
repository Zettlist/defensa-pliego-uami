import { VIEWS, ejeLabel, hasAll, slug } from '../lib.js';

export function Sidebar({ e, ix, view, terms, counts, other, otherCounts }) {
  const searching = terms.length > 0;
  const pts = e.puntos.map((p, i) => ({ p, hit: hasAll(ix.puntos[i].all, terms) }));
  const viewCount = { debilidades: counts?.deb, glosario: counts?.glos, advertencias: counts?.adv };
  const total = { debilidades: e.debilidades.length, advertencias: e.advertencias.length };

  return (
    <nav className="side" aria-label={`Índice del ${ejeLabel(e)}`}>
      <a className={`side-link side-home ${view === 'inicio' ? 'is-cur' : ''}`} href={`#${e.id}-inicio`} aria-current={view === 'inicio' ? 'page' : undefined}>
        Resumen para la mesa
      </a>

      <h2 className="side-h">Puntos del pliego{searching && <span className="side-c">{counts.puntos} de {e.puntos.length}</span>}</h2>
      <ul className="side-list">
        {pts.map(({ p, hit }) => {
          const cur = view === slug(p.pid);
          return (
            <li key={p.pid} className={searching && !hit ? 'is-dim' : ''}>
              <a className={`side-pt ${cur ? 'is-cur' : ''}`} href={`#${e.id}-${slug(p.pid)}`} aria-current={cur ? 'page' : undefined}>
                <span className="side-pid">{p.pid}</span>
                <span className="side-res">{p.resumen}</span>
                {searching && hit && <span className="dot" aria-label="coincide" />}
              </a>
            </li>
          );
        })}
      </ul>

      <h2 className="side-h">Panorama</h2>
      <ul className="side-list">
        {VIEWS.slice(1).map((v) => {
          const cur = view === v.id;
          const n = searching ? viewCount[v.id] : total[v.id];
          return (
            <li key={v.id} className={searching && viewCount[v.id] === 0 ? 'is-dim' : ''}>
              <a className={`side-link ${cur ? 'is-cur' : ''}`} href={`#${e.id}-${v.id}`} aria-current={cur ? 'page' : undefined}>
                <span>{v.label}</span>
                {n != null && <span className="side-c">{n}</span>}
              </a>
            </li>
          );
        })}
      </ul>

      {searching && other && otherCounts?.total > 0 && (
        <a className="side-other" href={`#${other.id}-inicio`}>
          También hay {otherCounts.total} {otherCounts.total === 1 ? 'coincidencia' : 'coincidencias'} en el {ejeLabel(other)}
        </a>
      )}
    </nav>
  );
}

export function MobileNav({ e, view, onGo }) {
  return (
    <div className="mnav">
      <label className="sr-only" htmlFor="mnav-sel">Ir a una sección del {ejeLabel(e)}</label>
      <select id="mnav-sel" value={view} onChange={(ev) => onGo(ev.target.value)}>
        <option value="inicio">Resumen para la mesa</option>
        <optgroup label="Puntos del pliego">
          {e.puntos.map((p) => (
            <option key={p.pid} value={slug(p.pid)}>{p.pid} · {p.resumen.length > 60 ? p.resumen.slice(0, 58) + '…' : p.resumen}</option>
          ))}
        </optgroup>
        <optgroup label="Panorama">
          {VIEWS.slice(1).map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </optgroup>
      </select>
    </div>
  );
}
