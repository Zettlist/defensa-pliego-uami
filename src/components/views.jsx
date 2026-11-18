import { useMemo } from 'react';
import Rich, { Hl } from './Rich.jsx';
import Collapsible from './Collapsible.jsx';
import useFolds from './useFolds.js';
import { IconCollapse, IconExpand, IconLeft, IconRight } from './icons.jsx';
import { ejeLabel, hasAll, hasAny, norm, paras, parseVerificacion, slug, verdictOf } from '../lib.js';

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

function FoldTools({ folds }) {
  return (
    <div className="fold-tools" role="group" aria-label="Desplegables">
      <button type="button" className="btn btn-quiet" onClick={folds.openAll}><IconExpand />Abrir todo</button>
      <button type="button" className="btn btn-quiet" onClick={folds.closeAll}><IconCollapse />Cerrar todo</button>
    </div>
  );
}

function ViewHead({ e, eyebrow, title, children, headRef }) {
  return (
    <header className="view-head">
      <p className="eyebrow">{eyebrow || `${ejeLabel(e)} · ${e.title}`}</p>
      <h1 className="view-title" tabIndex={-1} ref={headRef}>{title}</h1>
      {children}
    </header>
  );
}

function NoResults({ what }) {
  return <p className="empty">Sin coincidencias en {what} de este eje.</p>;
}

/* ---------------- Resumen para la mesa ---------------- */

export function Overview({ data, e, ix, terms, headRef }) {
  const searching = terms.length > 0;
  const rows = e.puntos.map((p, i) => ({ p, hit: hasAll(ix.puntos[i].all, terms) })).filter((r) => !searching || r.hit);
  const nCitas = Object.keys(data.citas).filter((k) => k.startsWith(e.code + ':')).length;
  const folds = useFolds(['intro'], hasAny(ix.intro, terms) ? ['intro'] : [], terms.join(' '));

  return (
    <div className="view">
      <ViewHead e={e} eyebrow={`Mesa de diálogo · ${data.mesa}`} title={e.full || e.title} headRef={headRef}>
        <dl className="stats">
          <div><dt>Puntos del pliego</dt><dd>{e.puntos.length}</dd></div>
          <div><dt>Debilidades expuestas</dt><dd>{e.debilidades.length}</dd></div>
          <div><dt>Citas con página</dt><dd>{nCitas}</dd></div>
        </dl>
      </ViewHead>

      <section aria-labelledby="ov-h">
        <div className="sec-head">
          <h2 id="ov-h" className="sec-title">Resumen para la mesa</h2>
          <p className="sec-sub">Cada punto con su mínimo aceptable. Abre un punto para ver el texto completo, la evidencia y la réplica.</p>
        </div>
        {searching && !rows.length && <NoResults what="los puntos" />}
        <ol className="ov-list">
          {rows.map(({ p }) => (
            <li key={p.pid}>
              <a className="ov-row" href={`#${e.id}-${slug(p.pid)}`}>
                <span className="ov-pid">{p.pid}</span>
                <span className="ov-main">
                  <Hl className="ov-res" text={p.resumen} terms={terms} />
                  <span className="ov-min">
                    <span className="ov-min-l">Mínimo aceptable</span>
                    {p.minimo
                      ? <Rich as="span" className="ov-min-t" html={p.minimo} terms={terms} />
                      : <span className="ov-min-t muted">Sin mínimo definido para este punto.</span>}
                  </span>
                </span>
                <IconRight className="ov-go" />
              </a>
            </li>
          ))}
        </ol>
      </section>

      {e.intro && (
        <Collapsible title="Fuentes y plazos de esta defensa" open={folds.isOpen('intro')} onToggle={() => folds.toggle('intro')} level={2} className="fold-intro" hit={hasAny(ix.intro, terms)}>
          <Rich className="prose" html={e.intro} terms={terms} />
        </Collapsible>
      )}
    </div>
  );
}

/* ---------------- Punto ---------------- */

const SECTIONS = [
  { k: 'dij', title: 'Lo que dijeron ellos', n: 'nd' },
  { k: 'nor', title: 'Norma que los obliga', n: 'nn' },
  { k: 'rep', title: 'Lo que dirán · réplica' },
  { k: 'cri', title: 'Criterios de éxito' },
];

export function Point({ e, ix, idx, terms, mesa, headRef }) {
  const p = e.puntos[idx];
  const f = ix.puntos[idx].f;
  const secs = SECTIONS.filter((s) => p[s.k]);
  const keys = [...(p.grupo?.length ? ['grupo'] : []), ...secs.map((s) => s.k)];
  const matchKeys = keys.filter((k) => hasAny(f[k], terms));
  const folds = useFolds(keys, matchKeys, terms.join(' '));
  const prev = e.puntos[idx - 1];
  const next = e.puntos[idx + 1];

  return (
    <article className={`view point ${mesa ? 'is-mesa' : ''}`}>
      <ViewHead e={e} eyebrow={`${ejeLabel(e)} · ${e.title} · punto ${idx + 1} de ${e.puntos.length}`} title={
        <><span className="pt-pid">{p.pid}</span><Hl className="pt-res" text={p.resumen} terms={terms} /></>
      } headRef={headRef} />

      {!mesa && keys.length > 0 && <FoldTools folds={folds} />}

      {!mesa && p.grupo?.length > 0 && (
        <Collapsible title="Encabezado común del punto" open={folds.isOpen('grupo')} onToggle={() => folds.toggle('grupo')} className="fold-grupo" hit={matchKeys.includes('grupo')}>
          <Rich className="prose grupo" html={paras(p.grupo)} terms={terms} />
        </Collapsible>
      )}

      <section className="exige" aria-labelledby={`ex-${p.pid}`}>
        <h2 className="block-label" id={`ex-${p.pid}`}>Lo que exigimos <span>texto completo del pliego</span></h2>
        <Rich className="exige-text" html={paras(p.exige)} terms={terms} />
      </section>

      <section className="minimo" aria-labelledby={`mn-${p.pid}`}>
        <h2 className="block-label" id={`mn-${p.pid}`}>Mínimo aceptable</h2>
        {p.minimo
          ? <Rich className="minimo-text" html={p.minimo} terms={terms} />
          : <p className="minimo-text muted">Sin mínimo definido para este punto.</p>}
      </section>

      {mesa ? (
        <div className="mesa-blocks">
          {secs.filter((s) => s.k === 'rep' || s.k === 'cri').map((s) => (
            <section className={`mesa-block mb-${s.k}`} key={s.k} aria-labelledby={`mb-${s.k}`}>
              <h2 className="block-label" id={`mb-${s.k}`}>{s.title}</h2>
              <Rich className="prose" html={p[s.k]} terms={terms} />
            </section>
          ))}
        </div>
      ) : (
        <div className="folds">
          {secs.map((s) => (
            <Collapsible
              key={s.k}
              title={s.title}
              meta={s.n && p[s.n] != null ? plural(p[s.n], 'cita', 'citas') : null}
              open={folds.isOpen(s.k)}
              onToggle={() => folds.toggle(s.k)}
              level={2}
              hit={matchKeys.includes(s.k)}
              className={`fold-${s.k}`}
            >
              <Rich className="prose" html={p[s.k]} terms={terms} />
            </Collapsible>
          ))}
        </div>
      )}

      <nav className="pager" aria-label="Puntos">
        {prev ? (
          <a className="pager-link" href={`#${e.id}-${slug(prev.pid)}`} rel="prev">
            <span className="pager-dir"><IconLeft />Anterior</span>
            <span className="pager-t"><b>{prev.pid}</b> {prev.resumen}</span>
          </a>
        ) : <a className="pager-link" href={`#${e.id}-inicio`}><span className="pager-dir"><IconLeft />Volver</span><span className="pager-t">Resumen para la mesa</span></a>}
        {next ? (
          <a className="pager-link is-next" href={`#${e.id}-${slug(next.pid)}`} rel="next">
            <span className="pager-dir">Siguiente<IconRight /></span>
            <span className="pager-t"><b>{next.pid}</b> {next.resumen}</span>
          </a>
        ) : <a className="pager-link is-next" href={`#${e.id}-debilidades`}><span className="pager-dir">Siguiente<IconRight /></span><span className="pager-t">Debilidades expuestas</span></a>}
      </nav>
    </article>
  );
}

/* ---------------- Debilidades ---------------- */

export function Debilidades({ e, ix, terms, headRef }) {
  const searching = terms.length > 0;
  const items = e.debilidades.map((c, i) => ({ c, i, hit: hasAll(ix.deb[i].all, terms) })).filter((x) => !searching || x.hit);
  const keys = e.debilidades.map((_, i) => 's' + i);
  const matchKeys = e.debilidades.map((_, i) => (hasAny(ix.deb[i].f.src, terms) ? 's' + i : null)).filter(Boolean);
  const folds = useFolds(keys, matchKeys, terms.join(' '));

  return (
    <div className="view">
      <ViewHead e={e} title="Debilidades expuestas" headRef={headRef}>
        <p className="lead">Lo que la propia respuesta de la autoridad deja al descubierto. Cada tarjeta trae sus fuentes en un desplegable.</p>
      </ViewHead>
      <FoldTools folds={folds} />
      {searching && !items.length && <NoResults what="las debilidades" />}
      <ol className="cards">
        {items.map(({ c, i }) => (
          <li className="card" key={i}>
            <p className="card-n">{String(i + 1).padStart(2, '0')}</p>
            <Rich as="h2" className="card-t" html={c.t} terms={terms} />
            <Rich className="card-b prose" html={c.b} terms={terms} />
            {c.src && (
              <Collapsible title="Fuentes" meta={plural((c.src.match(/class="cite/g) || []).length, 'cita', 'citas')} open={folds.isOpen('s' + i)} onToggle={() => folds.toggle('s' + i)} level={3} className="fold-src" hit={matchKeys.includes('s' + i)}>
                <Rich className="prose" html={c.src} terms={terms} />
              </Collapsible>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------- Verificación ---------------- */

export function Verificacion({ e, terms, headRef }) {
  const parsed = useMemo(() => parseVerificacion(e.verificacion), [e.verificacion]);
  const groups = useMemo(() => {
    if (!parsed.rows) return [];
    const m = new Map();
    for (const cells of parsed.rows) {
      const v = verdictOf(cells[parsed.vi]?.text);
      if (!m.has(v.group)) m.set(v.group, { ...v, rows: [] });
      m.get(v.group).rows.push({ cells, v, text: norm(cells.map((c) => c.text).join(' ')) });
    }
    return [...m.values()].sort((a, b) => a.order - b.order);
  }, [parsed]);
  const searching = terms.length > 0;
  const keys = groups.map((g) => g.group);
  const matchKeys = groups.filter((g) => g.rows.some((r) => hasAll(r.text, terms))).map((g) => g.group);
  const folds = useFolds(keys, matchKeys, terms.join(' '));

  return (
    <div className="view">
      <ViewHead e={e} title="Verificación de citas" headRef={headRef} />
      <Rich className="prose verif-intro" html={parsed.intro} terms={terms} />
      {parsed.rows && (
        <>
          <FoldTools folds={folds} />
          {searching && !matchKeys.length && <NoResults what="la verificación" />}
          <div className="folds">
            {groups.map((g) => {
              const rows = searching ? g.rows.filter((r) => hasAll(r.text, terms)) : g.rows;
              if (searching && !rows.length) return null;
              return (
                <Collapsible key={g.group} title={<><span className={`vdot v-${g.cls}`} aria-hidden="true" />{g.group}</>} meta={plural(rows.length, 'cita', 'citas')} open={folds.isOpen(g.group)} onToggle={() => folds.toggle(g.group)} level={2} hit={searching}>
                  <table className="vt">
                    {parsed.head && (
                      <thead><tr>{parsed.head.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
                    )}
                    <tbody>
                      {rows.map((r, ri) => (
                        <tr key={ri}>
                          {r.cells.map((c, ci) => (
                            <td key={ci} data-label={parsed.head?.[ci] || ''}>
                              {ci === parsed.vi
                                ? <><span className={`verdict v-${r.v.cls}`}>{r.v.label}</span>{r.v.rest && <span className="verdict-rest"> {r.v.rest}</span>}</>
                                : <Rich as="span" html={c.html} terms={terms} />}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Collapsible>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Glosario ---------------- */

export function Glosario({ e, ix, terms, headRef }) {
  const searching = terms.length > 0;
  const keys = e.glosario.map((_, i) => 'g' + i);
  const visible = e.glosario.map((g, i) => {
    const gx = ix.glos[i];
    const headHit = hasAll(gx.head, terms);
    const items = g.items.map((it, j) => ({ it, j })).filter(({ j }) => !searching || headHit || hasAll(gx.items[j], terms));
    return { g, i, items };
  });
  const matchKeys = visible.filter((v) => searching && v.items.length).map((v) => 'g' + v.i);
  const folds = useFolds(keys, matchKeys, terms.join(' '));
  const any = visible.some((v) => v.items.length);

  return (
    <div className="view">
      <ViewHead e={e} title="Glosario" headRef={headRef} />
      <FoldTools folds={folds} />
      {searching && !any && <NoResults what="el glosario" />}
      <div className="folds">
        {visible.map(({ g, i, items }) => {
          if (searching && !items.length) return null;
          return (
            <Collapsible key={i} title={<Rich as="span" html={g.g} terms={terms} />} meta={plural(items.length, 'término', 'términos')} open={folds.isOpen('g' + i)} onToggle={() => folds.toggle('g' + i)} level={2} hit={matchKeys.includes('g' + i)}>
              {g.nota && <Rich as="p" className="note" html={g.nota} terms={terms} />}
              <dl className="glos">
                {items.map(({ it, j }) => (
                  <div className="glos-row" key={j}>
                    <Rich as="dt" html={it.t} terms={terms} />
                    <Rich as="dd" html={it.d} terms={terms} />
                  </div>
                ))}
              </dl>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Advertencias ---------------- */

// Cada advertencia: la primera oración como título (pizarrón) y el resto desplegable (profundización).
function splitFirst(html) {
  if (/<[a-z]/i.test(html)) return { head: html, body: '' };
  const m = html.match(/^(.+?[.:;])\s+(?=[A-ZÁÉÍÓÚÑ"“¿(])/s);
  if (!m || m[1].length > 260) return { head: html, body: '' };
  return { head: m[1], body: html.slice(m[0].length) };
}

export function Advertencias({ e, ix, terms, headRef }) {
  const searching = terms.length > 0;
  const all = useMemo(() => e.advertencias.map((a, i) => ({ i, ...splitFirst(a) })), [e.advertencias]);
  const items = all.filter(({ i }) => !searching || hasAll(ix.adv[i], terms));
  const keys = all.filter((a) => a.body).map((a) => 'a' + a.i);
  const matchKeys = all.filter((a) => a.body && hasAny(norm(a.body), terms)).map((a) => 'a' + a.i);
  const folds = useFolds(keys, matchKeys, terms.join(' '));
  return (
    <div className="view">
      <ViewHead e={e} title="Advertencias" headRef={headRef}>
        <p className="lead">Límites de la evidencia y cuidados al usarla en la mesa.</p>
      </ViewHead>
      {keys.length > 0 && <FoldTools folds={folds} />}
      {searching && !items.length && <NoResults what="las advertencias" />}
      <ol className="adv">
        {items.map(({ i, head, body }) => (
          <li key={i} className="adv-item">
            <span className="adv-n" aria-hidden="true">{i + 1}</span>
            {body ? (
              <Collapsible title={<Rich as="span" html={head} terms={terms} />} open={folds.isOpen('a' + i)} onToggle={() => folds.toggle('a' + i)} level={2} hit={matchKeys.includes('a' + i)} className="fold-adv">
                <Rich className="prose" html={body} terms={terms} />
              </Collapsible>
            ) : (
              <Rich className="prose adv-solo" html={head} terms={terms} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
