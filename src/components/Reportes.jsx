import { useMemo, useState } from 'react';
import Collapsible from './Collapsible.jsx';

/*
  Reportes de la comunidad (p.reportes en data.json, hoy en el 3.4).
  Pestañas: Hallazgos · Tabla dinámica (filas × columnas elegibles, clic en una celda filtra) · Reportes
  (agrupados por división › carrera › laboratorio).
  Cada reporte: { n, fila, division, division_hoja, carrera, laboratorio, edificios[], cats[], resumen, texto, evidencia }.
*/

const DIMS = {
  division: { label: 'División', of: (r) => [r.division] },
  carrera: { label: 'Carrera', of: (r) => [r.carrera] },
  laboratorio: { label: 'Laboratorio', of: (r) => [`${r.laboratorio} · ${r.carrera}`] },
  edificio: { label: 'Edificio', of: (r) => r.edificios },
  cat: { label: 'Problema', of: (r) => r.cats },
};
const FILAS = ['division', 'carrera', 'laboratorio', 'edificio', 'cat'];
const COLS = ['cat', 'division', 'edificio', ''];
const SIN = 'Sin especificar';

const byCount = (c) => (a, b) => (a === SIN) - (b === SIN) || c[b] - c[a] || a.localeCompare(b, 'es');

function Chips({ label, value, options, onChange }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" className="chip" aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
          {o.label}{o.n != null && <span className="chip-n">{o.n}</span>}
        </button>
      ))}
    </div>
  );
}

function filaUrl(url, fila) {
  // Abre la hoja en la fila del reporte (rango A{fila}:F{fila}).
  return url ? `${url.split('#')[0].replace(/\?.*$/, '')}#gid=0&range=A${fila}:F${fila}` : '';
}

/* ---------- Hallazgos ---------- */

function Hallazgos({ rep, verFilas }) {
  return (
    <div className="cl-pane rp-hall">
      <ol className="rp-hl">
        {rep.hallazgos.map((h, i) => (
          <li key={i}>
            <h4>{h.t}</h4>
            <p>{h.b}</p>
            {h.filas?.length > 0 && (
              <p className="rp-src">
                <span>Filas {h.filas.join(', ')}</span>
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => verFilas(h.filas, h.t)}>
                  Ver {h.filas.length} reportes
                </button>
              </p>
            )}
          </li>
        ))}
      </ol>
      {rep.advertencias?.length > 0 && (
        <div className="rp-adv">
          <h4>Advertencias sobre estos datos</h4>
          <ul>{rep.advertencias.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

/* ---------- Tabla dinámica ---------- */

function Pivot({ items, catName, onPick }) {
  const [fila, setFila] = useState('division');
  const [col, setCol] = useState('cat');
  const nameOf = (dim, v) => (dim === 'cat' ? catName[v] || v : v);

  const { rows, cols, cell, rowTot, colTot, rowSets } = useMemo(() => {
    const cell = {}, rowTot = {}, colTot = {};
    const rowSets = {}, colSets = {};
    for (const r of items) {
      const rk = [...new Set(DIMS[fila].of(r))];
      const ck = col ? [...new Set(DIMS[col].of(r))] : ['Total'];
      for (const a of rk) {
        (rowSets[a] ||= new Set()).add(r.n);
        for (const b of ck) {
          const k = a + '\u0000' + b;
          (cell[k] ||= new Set()).add(r.n);
          (colSets[b] ||= new Set()).add(r.n);
        }
      }
    }
    for (const [k, s] of Object.entries(rowSets)) rowTot[k] = s.size;
    for (const [k, s] of Object.entries(colSets)) colTot[k] = s.size;
    return {
      rows: Object.keys(rowTot).sort(byCount(rowTot)),
      cols: Object.keys(colTot).sort(byCount(colTot)),
      cell, rowTot, colTot, rowSets,
    };
  }, [items, fila, col]);

  const max = Math.max(1, ...Object.values(cell).map((s) => s.size));
  const pick = (ns, titulo) => onPick([...ns], titulo);
  const varias = fila === 'cat' || fila === 'edificio' || col === 'cat' || col === 'edificio';

  return (
    <div className="cl-pane">
      <div className="cl-bar rp-bar">
        <label className="cl-field"><span>Filas</span>
          <select value={fila} onChange={(ev) => { setFila(ev.target.value); if (ev.target.value === col) setCol(''); }}>
            {FILAS.map((d) => <option key={d} value={d}>{DIMS[d].label}</option>)}
          </select>
        </label>
        <label className="cl-field"><span>Columnas</span>
          <select value={col} onChange={(ev) => setCol(ev.target.value)}>
            {COLS.filter((d) => d !== fila).map((d) => <option key={d} value={d}>{d ? DIMS[d].label : 'Solo total'}</option>)}
          </select>
        </label>
      </div>
      <div className="cl-wrap rp-pv-wrap">
        <table className="rp-pv">
          <thead>
            <tr>
              <th scope="col" className="rp-pv-rh">{DIMS[fila].label}</th>
              <th scope="col" className="rp-pv-tot">Reportes</th>
              {col && cols.map((c) => <th scope="col" key={c} title={nameOf(col, c)}><span>{nameOf(col, c)}</span></th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r}>
                <th scope="row" className="rp-pv-rh">{nameOf(fila, r)}</th>
                <td className="rp-pv-tot">
                  <button type="button" onClick={() => pick(rowSets[r], nameOf(fila, r))}>
                    {rowTot[r]}
                  </button>
                </td>
                {col && cols.map((c) => {
                  const s = cell[r + '\u0000' + c];
                  const n = s?.size || 0;
                  return (
                    <td key={c} style={{ '--a': n / max }} className={n ? 'has-n' : ''}>
                      {n ? (
                        <button type="button" onClick={() => pick(s, `${nameOf(fila, r)} · ${nameOf(col, c)}`)}
                          aria-label={`${n} reportes: ${nameOf(fila, r)}, ${nameOf(col, c)}`}>{n}</button>
                      ) : <span aria-hidden="true">·</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {col && (
            <tfoot>
              <tr>
                <th scope="row" className="rp-pv-rh">Reportes</th>
                <td className="rp-pv-tot rp-pv-all">{items.length}</td>
                {cols.map((c) => <td key={c} className="rp-pv-tot">{colTot[c]}</td>)}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="cl-hint">
        Clic en un número para ver esos reportes.
        {varias && ' Un reporte puede contar en varios problemas o edificios, así que las columnas no suman el total.'}
      </p>
    </div>
  );
}

/* ---------- Lista agrupada ---------- */

function Lista({ items, rep, catName, sel, clearSel }) {
  const [div, setDiv] = useState('');
  const [cat, setCat] = useState('');
  const base = sel ? items.filter((r) => sel.ns.includes(r.n)) : items;
  const vis = base.filter((r) => (!div || r.division === div) && (!cat || r.cats.includes(cat)));
  const divs = [...new Set(items.map((r) => r.division))].sort();
  const catsN = Object.fromEntries(rep.categorias.map((c) => [c.id, base.filter((r) => (!div || r.division === div) && r.cats.includes(c.id)).length]));

  const tree = {};
  for (const r of vis) ((tree[r.division] ||= {})[r.carrera] ||= {})[r.laboratorio] ||= [];
  for (const r of vis) tree[r.division][r.carrera][r.laboratorio].push(r);
  const cnt = (o) => (Array.isArray(o) ? o.length : Object.values(o).reduce((s, x) => s + cnt(x), 0));
  const ord = (o) => Object.keys(o).sort((a, b) => cnt(o[b]) - cnt(o[a]) || a.localeCompare(b, 'es'));

  return (
    <div className="cl-pane">
      {sel && (
        <p className="rp-sel">
          <span>Mostrando <b>{sel.titulo}</b> · {sel.ns.length} reportes</span>
          <button type="button" className="btn btn-quiet btn-sm" onClick={clearSel}>Ver todos</button>
        </p>
      )}
      <div className="cl-bar">
        <Chips label="División" value={div} onChange={setDiv}
          options={[{ v: '', label: 'Todas', n: base.length }, ...divs.map((d) => ({ v: d, label: d, n: base.filter((r) => r.division === d).length }))]} />
        <label className="cl-field"><span>Problema</span>
          <select value={cat} onChange={(ev) => setCat(ev.target.value)}>
            <option value="">Todos</option>
            {rep.categorias.filter((c) => catsN[c.id]).map((c) => <option key={c.id} value={c.id}>{c.t} ({catsN[c.id]})</option>)}
          </select>
        </label>
      </div>
      {!vis.length ? <p className="empty">Ningún reporte con estos filtros.</p> : ord(tree).map((d) => (
        <section key={d} className="rp-div">
          <h4 className="rp-h-div">{d} <span>{cnt(tree[d])} reportes</span></h4>
          {ord(tree[d]).map((c) => (
            <div key={c} className="rp-car">
              <h5 className="rp-h-car">{c} <span>{cnt(tree[d][c])}</span></h5>
              {ord(tree[d][c]).map((l) => (
                <div key={l} className="rp-lab">
                  <p className="rp-h-lab">{l}{tree[d][c][l][0].edificios[0] !== SIN && <span>Edificio {tree[d][c][l][0].edificios.join(', ')}</span>}</p>
                  <ul className="rp-items">
                    {tree[d][c][l].map((r) => (
                      <li key={r.n} className="rp-item">
                        <p className="rp-res">{r.resumen}</p>
                        <div className="rp-tags">
                          {r.cats.map((k) => <span key={k} className={`pill ${k === 'riesgo' ? 'pill-bad' : 'pill-mute'}`}>{catName[k]}</span>)}
                        </div>
                        <details className="rp-txt">
                          <summary>Testimonio completo</summary>
                          <blockquote>{r.texto.split(/\n+/).map((t, i) => <p key={i}>{t}</p>)}</blockquote>
                        </details>
                        <p className="rp-meta">
                          {r.origen === 'formulario'
                            ? <span>Formulario, fila {r.fila}</span>
                            : <a href={filaUrl(rep.fuente?.url, r.fila)} target="_blank" rel="noopener noreferrer">Fila {r.fila} de la hoja ↗</a>}
                          <span>Evidencia: {r.evidencia}</span>
                          {r.division_hoja && <span className="rp-fix">En {r.origen === 'formulario' ? 'el formulario' : 'la hoja'} dice {r.division_hoja}</span>}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

/* ---------- Contenedor ---------- */

export default function Reportes({ rep, pid, open, onToggle, hit }) {
  const items = rep.items || [];
  const catName = useMemo(() => Object.fromEntries((rep.categorias || []).map((c) => [c.id, c.t])), [rep]);
  const [tab, setTab] = useState('hall');
  const [sel, setSel] = useState(null);
  if (!items.length) return null;

  const filasToN = (filas) => items.filter((r) => filas.includes(r.fila)).map((r) => r.n);
  const verNs = (ns, titulo) => { setSel({ ns, titulo }); setTab('lista'); };
  const tabs = [
    { id: 'hall', label: 'Hallazgos', n: rep.hallazgos?.length || 0 },
    { id: 'pivot', label: 'Tabla dinámica' },
    { id: 'lista', label: 'Reportes por división', n: items.length },
  ];
  const idBase = `rp-${pid.replace(/[^A-Za-z0-9]/g, '-')}`;
  const nLabs = new Set(items.map((r) => r.laboratorio)).size;
  const onKey = (ev) => {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
    ev.preventDefault(); ev.stopPropagation();
    const i = tabs.findIndex((t) => t.id === tab);
    const n = tabs[(i + (ev.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    setTab(n.id);
    document.getElementById(`${idBase}-tab-${n.id}`)?.focus();
  };

  return (
    <Collapsible title={rep.titulo || 'Reportes de la comunidad'} meta={`${items.length} reportes · ${nLabs} laboratorios`}
      open={open} onToggle={onToggle} level={2} hit={hit} className="fold-checklist checklist fold-reportes">
      {rep.fuente && (
        <p className="rp-fuente">
          Fuente: {rep.fuente.url ? <a href={rep.fuente.url} target="_blank" rel="noopener noreferrer">{rep.fuente.nombre} ↗</a> : rep.fuente.nombre}
          {rep.fuente.corte && <> · corte {rep.fuente.corte}</>}
        </p>
      )}
      <div className="cl-tabs" role="tablist" aria-label={rep.titulo} onKeyDown={onKey}>
        {tabs.map((t) => (
          <button key={t.id} id={`${idBase}-tab-${t.id}`} type="button" role="tab" className="cl-tab"
            aria-selected={tab === t.id} aria-controls={`${idBase}-panel`} tabIndex={tab === t.id ? 0 : -1} onClick={() => setTab(t.id)}>
            <span>{t.label}</span>{t.n != null && <span className="chip-n">{t.n}</span>}
          </button>
        ))}
      </div>
      <div id={`${idBase}-panel`} role="tabpanel" aria-labelledby={`${idBase}-tab-${tab}`}>
        {tab === 'hall' && <Hallazgos rep={rep} verFilas={(filas, t) => verNs(filasToN(filas), t)} />}
        {tab === 'pivot' && <Pivot items={items} catName={catName} onPick={verNs} />}
        {tab === 'lista' && <Lista items={items} rep={rep} catName={catName} sel={sel} clearSel={() => setSel(null)} />}
      </div>
    </Collapsible>
  );
}
