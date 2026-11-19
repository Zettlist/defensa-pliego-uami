import { useEffect, useMemo, useState } from 'react';
import Collapsible from './Collapsible.jsx';

/*
  Checklist de un punto (p.checklist en data.json). Sirve para cualquier punto que lo traiga.
  - Pestaña de documentos: estado editable, guardado en localStorage ("checklist:<pid>").
  - Pestaña de línea de tiempo: "danos" (3.1, separa lo ocurrido durante la constancia de los antecedentes)
    o "linea" (3.2 en adelante, con su "titulo_linea").
  Las claves de cita usan el mismo <button class="cite"> que el resto de la app (lo abre la delegación de App).
*/

const ESTADO_TONE = { 'Tenemos': 'ok', 'Falta': 'bad', 'Por confirmar': 'warn', 'Pedido en la mesa': 'info' };
const PESO_TONE = { 'Fuerte': 'bad', 'Medio': 'warn', 'Débil': 'mute', 'Referencia': 'info' };
const PESOS = ['Fuerte', 'Medio', 'Débil', 'Referencia'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const docKey = (d) => `${d.edificio}|${d.documento}`;

function fmtFecha(s) {
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(s || '');
  if (!m) return s || '';
  const [, y, mo, d] = m;
  if (!mo) return y;
  const mes = MESES[+mo - 1] || mo;
  return d ? `${+d} ${mes} ${y}` : `${mes} ${y}`;
}

// localStorage puede fallar (modo privado, almacenamiento bloqueado): la app sigue con los valores de data.json.
function readStore(key) {
  try {
    const v = JSON.parse(window.localStorage.getItem(key) || 'null');
    return v && typeof v === 'object' ? v : {};
  } catch { return {}; }
}
function writeStore(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

// Edificios: "T, R, C" o "R y AT" se separan en letras; textos libres ("Varios (sin nombrar)") quedan enteros.
function edificiosDe(s) {
  const t = (s || '').trim();
  if (/^[A-Z]{1,3}((\s*,\s*|\s+y\s+)[A-Z]{1,3})*$/.test(t)) return t.split(/\s*,\s*|\s+y\s+/);
  return [t];
}

// Índice clave -> datos del botón de cita que ya existe en el HTML de data.json (enlace, página, etiqueta).
function useCiteIndex(data) {
  return useMemo(() => {
    const ix = {};
    const tpl = document.createElement('template');
    const scan = (html) => {
      if (typeof html !== 'string' || !html.includes('data-k')) return;
      tpl.innerHTML = html;
      for (const b of tpl.content.querySelectorAll('button.cite[data-k]')) {
        if (ix[b.dataset.k]) continue;
        ix[b.dataset.k] = {
          u: b.dataset.u || '', s: b.dataset.s || '', p: b.dataset.p || '',
          id: b.querySelector('b')?.textContent || '', label: b.querySelector('span')?.textContent || '',
        };
      }
    };
    const walk = (v) => {
      if (typeof v === 'string') scan(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(data.ejes);
    return ix;
  }, [data]);
}

function CiteBtn({ k, info, fallbackUrl, fallbackLabel }) {
  const id = info?.id || k.split(':').pop();
  return (
    <button type="button" className="cite" data-k={k} data-u={info?.u || fallbackUrl || ''} data-s={info?.s || ''} data-p={info?.p || ''}>
      <b>{id}</b><span>{info?.label || fallbackLabel || ''}</span>
    </button>
  );
}

function Pill({ tone, children }) {
  return <span className={`pill pill-${tone || 'mute'}`}>{children}</span>;
}

function Chips({ label, value, options, onChange }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" className={`chip ${o.tone ? 'chip-' + o.tone : ''}`} aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
          {o.label}{o.n != null && <span className="chip-n">{o.n}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Documentos ---------- */

function Documentos({ cl, pid }) {
  const storeKey = `checklist:${pid}`;
  const base = cl.documentos || [];
  const estados = cl.estados?.length ? cl.estados : Object.keys(ESTADO_TONE);
  const [over, setOver] = useState(() => readStore(storeKey));
  const [saved, setSaved] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => { setOver(readStore(storeKey)); }, [storeKey]);

  const original = (d) => base.find((b) => docKey(b) === docKey(d))?.estado;
  const docs = base.map((d) => {
    const o = over[docKey(d)];
    return { ...d, estado: estados.includes(o) ? o : d.estado, cambiado: estados.includes(o) && o !== d.estado };
  });
  const counts = Object.fromEntries(estados.map((s) => [s, docs.filter((d) => d.estado === s).length]));
  const nCambiados = docs.filter((d) => d.cambiado).length;

  const setEstado = (d, v) => {
    const next = { ...over };
    if (v === original(d)) delete next[docKey(d)]; else next[docKey(d)] = v;
    setOver(next);
    setSaved(writeStore(storeKey, next));
  };
  const restablecer = () => { setOver({}); setSaved(writeStore(storeKey, {})); };

  const exportar = () => {
    const out = {
      punto: pid,
      exportado: new Date().toISOString(),
      nota: 'Estados actuales del checklist. "estado_en_data_json" es el valor que trae data.json hoy.',
      documentos: docs.map((d) => ({
        edificio: d.edificio, documento: d.documento, estado: d.estado,
        ...(d.cambiado ? { estado_en_data_json: original(d) } : {}),
      })),
    };
    try {
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `checklist-${pid}-estados.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch { /* sin descarga en este navegador */ }
  };

  const visibles = filtro ? docs.filter((d) => d.estado === filtro) : docs;

  return (
    <div className="cl-pane">
      <p className="cl-count" aria-live="polite">
        {estados.filter((s) => counts[s] > 0).map((s, i) => (
          <span key={s}>{i > 0 && <span className="cl-sep"> · </span>}<b className={`tone-${ESTADO_TONE[s] || 'mute'}`}>{counts[s]}</b> {s}</span>
        ))}
      </p>

      <div className="cl-bar">
        <Chips label="Filtrar por estado" value={filtro} onChange={setFiltro}
          options={[{ v: '', label: 'Todos', n: docs.length }, ...estados.map((s) => ({ v: s, label: s, n: counts[s], tone: ESTADO_TONE[s] }))]} />
        <div className="cl-actions">
          {nCambiados > 0 && <button type="button" className="btn btn-quiet btn-sm" onClick={restablecer}>Restablecer ({nCambiados})</button>}
          <button type="button" className="btn btn-sm" onClick={exportar}>Exportar estados</button>
        </div>
      </div>
      {!saved && <p className="cl-warn">No se pudo guardar en este navegador. Los cambios se pierden al recargar; usa "Exportar estados".</p>}
      {nCambiados > 0 && saved && <p className="cl-hint">{nCambiados === 1 ? '1 estado cambiado' : `${nCambiados} estados cambiados`} en este dispositivo (no en data.json).</p>}

      {!visibles.length ? <p className="empty">Ningún documento con ese estado.</p> : (
        <div className="cl-wrap">
          <table className="cl-table">
            <thead>
              <tr>
                <th scope="col">Edificio / ámbito</th><th scope="col">Documento</th><th scope="col">Estado</th>
                <th scope="col">Fuente</th><th scope="col">Dónde</th><th scope="col">Notas</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((d, i) => {
                const prev = visibles[i - 1];
                const nuevoGrupo = !prev || prev.edificio !== d.edificio;
                return (
                  <tr key={docKey(d)} className={`${d.cambiado ? 'is-changed' : ''} ${nuevoGrupo ? 'is-first' : 'is-cont'}`}>
                    <td data-label="Edificio / ámbito" className="cl-ed">
                      <span className="cl-ed-n">{d.edificio}</span>
                      {d.que_es && <span className="cl-ed-q">{d.que_es}</span>}
                    </td>
                    <td data-label="Documento" className="cl-doc">{d.documento}</td>
                    <td data-label="Estado">
                      <label className={`estado-sel pill pill-${ESTADO_TONE[d.estado] || 'mute'}`}>
                        <span className="sr-only">Estado de {d.documento}</span>
                        <select value={d.estado} onChange={(ev) => setEstado(d, ev.target.value)}>
                          {estados.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                    </td>
                    <td data-label="Fuente">{d.fuente || '—'}</td>
                    <td data-label="Dónde">{d.donde || '—'}</td>
                    <td data-label="Notas" className="cl-notes">{d.notas || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- Línea de tiempo ("danos" del 3.1 o "linea" del 3.2 en adelante) ---------- */

function Linea({ items, conVigencia, vigencia, citeIx }) {
  const [ed, setEd] = useState('');
  const [peso, setPeso] = useState('');

  const edificios = useMemo(() => {
    const c = {};
    for (const d of items) for (const x of edificiosDe(d.edificio)) c[x] = (c[x] || 0) + 1;
    // Primero las claves de edificio (T, R, AT…), luego los textos libres.
    return Object.keys(c).sort((a, b) => (b.length <= 3) - (a.length <= 3) || a.localeCompare(b, 'es'));
  }, [items]);

  const pesos = PESOS.filter((p) => items.some((d) => d.peso === p))
    .concat([...new Set(items.map((d) => d.peso))].filter((p) => p && !PESOS.includes(p)));
  const match = (d) => (!ed || edificiosDe(d.edificio).includes(ed)) && (!peso || d.peso === peso);
  const byFecha = (a, b) => (a.fecha || '').localeCompare(b.fecha || '');
  const esAntecedente = (d) => /^no\b/i.test(d.durante_constancia || '');
  const pesoN = (p) => items.filter((d) => d.peso === p && (!ed || edificiosDe(d.edificio).includes(ed))).length;

  const Row = ({ d }) => (
    <li className={`tl-item tl-${PESO_TONE[d.peso] || 'mute'}`}>
      <div className="tl-date"><time dateTime={d.fecha}>{fmtFecha(d.fecha)}</time></div>
      <div className="tl-body">
        <div className="tl-top">
          <span className="tl-ed">{d.edificio}</span>
          {d.peso && <Pill tone={PESO_TONE[d.peso]}>{d.peso}</Pill>}
          {d.durante_constancia && !/^(sí|si|no\b)/i.test(d.durante_constancia) && <span className="tl-tag">{d.durante_constancia}</span>}
        </div>
        <p className="tl-que">{d.que}</p>
        <p className="tl-meta">
          {d.quien && <span><span className="tl-k">Quién:</span> {d.quien}</span>}
          {d.fuente && (
            <span><span className="tl-k">Fuente:</span>{' '}
              {d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer">{d.fuente}</a> : d.fuente}
            </span>
          )}
        </p>
        {d.claves?.length > 0 && (
          <div className="src tl-cites">
            {d.claves.map((k) => <CiteBtn key={k} k={k} info={citeIx[k]} fallbackUrl={d.url} fallbackLabel={d.fuente} />)}
          </div>
        )}
      </div>
    </li>
  );
  const List = ({ list }) => (list.length ? <ol className="tl">{list.map((d, i) => <Row key={i} d={d} />)}</ol> : <p className="empty">Nada con estos filtros.</p>);

  const filtrados = items.filter(match).sort(byFecha);
  const dentro = filtrados.filter((d) => !esAntecedente(d));
  const antes = filtrados.filter(esAntecedente);

  return (
    <div className="cl-pane">
      <div className="cl-bar">
        <label className="cl-field">
          <span>Edificio</span>
          <select value={ed} onChange={(ev) => setEd(ev.target.value)}>
            <option value="">Todos</option>
            {edificios.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <Chips label="Filtrar por peso" value={peso} onChange={setPeso}
          options={[{ v: '', label: 'Todos' }, ...pesos.map((p) => ({ v: p, label: p, n: pesoN(p), tone: PESO_TONE[p] }))]} />
      </div>

      {conVigencia ? (
        <>
          <section className="tl-sec tl-in">
            <h4 className="tl-h">Durante la constancia <span>{fmtFecha(vigencia?.desde)} – {fmtFecha(vigencia?.hasta)} · {dentro.length}</span></h4>
            <List list={dentro} />
          </section>
          <section className="tl-sec tl-out">
            <h4 className="tl-h">Antecedentes <span>antes de la constancia · {antes.length}</span></h4>
            <List list={antes} />
          </section>
        </>
      ) : (
        <section className="tl-sec"><List list={filtrados} /></section>
      )}
    </div>
  );
}

/* ---------- Contenedor plegable ---------- */

export default function Checklist({ checklist, pid, data, open, onToggle, hit }) {
  const citeIx = useCiteIndex(data);
  const esDanos = checklist.danos?.length > 0;
  const linea = esDanos ? checklist.danos : checklist.linea || [];
  const tabs = [
    checklist.documentos?.length ? { id: 'docs', label: 'Documentos por edificio', n: checklist.documentos.length } : null,
    linea.length ? { id: 'linea', label: checklist.titulo_linea || (esDanos ? 'Daños durante la constancia' : 'Línea de tiempo'), n: linea.length } : null,
  ].filter(Boolean);
  const [tab, setTab] = useState(tabs[0]?.id);
  if (!tabs.length) return null;
  const cur = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;
  const idBase = `cl-${pid.replace(/[^A-Za-z0-9]/g, '-')}`;
  const meta = tabs.map((t) => `${t.n} ${t.id === 'docs' ? 'documentos' : 'eventos'}`).join(' · ');

  const onKey = (ev) => {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
    ev.preventDefault(); ev.stopPropagation();
    const i = tabs.findIndex((t) => t.id === cur);
    const n = tabs[(i + (ev.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    setTab(n.id);
    document.getElementById(`${idBase}-tab-${n.id}`)?.focus();
  };

  return (
    <Collapsible title={checklist.titulo || 'Checklist'} meta={meta} open={open} onToggle={onToggle} level={2} hit={hit} className="fold-checklist checklist">
      <div className="cl-tabs" role="tablist" aria-label={checklist.titulo || 'Checklist'} onKeyDown={onKey}>
        {tabs.map((t) => (
          <button key={t.id} id={`${idBase}-tab-${t.id}`} type="button" role="tab" className="cl-tab"
            aria-selected={cur === t.id} aria-controls={`${idBase}-panel`} tabIndex={cur === t.id ? 0 : -1} onClick={() => setTab(t.id)}>
            <span>{t.label}</span><span className="chip-n">{t.n}</span>
          </button>
        ))}
      </div>
      <div id={`${idBase}-panel`} role="tabpanel" aria-labelledby={`${idBase}-tab-${cur}`}>
        {cur === 'docs'
          ? <Documentos cl={checklist} pid={pid} />
          : <Linea items={linea} conVigencia={esDanos} vigencia={checklist.vigencia_constancia} citeIx={citeIx} />}
      </div>
    </Collapsible>
  );
}
