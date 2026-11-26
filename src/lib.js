// Utilidades sin contenido: todo el texto de la defensa viene de data.json.

/** Minúsculas y sin acentos, para buscar sin distinguir "Unigénero" de "unigenero". */
export const norm = (s) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const tpl = typeof document !== 'undefined' ? document.createElement('template') : null;

/** Texto plano de un fragmento HTML (sin ejecutar nada). */
export function textOf(html) {
  if (!html) return '';
  tpl.innerHTML = html;
  return tpl.content.textContent || '';
}

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Párrafos de texto plano -> HTML seguro. */
export const paras = (arr) => (arr || []).map((t) => `<p>${esc(t)}</p>`).join('');

/** "1.1.a" -> "p1-1-a" (para el hash). */
export const slug = (pid) => 'p' + String(pid).replace(/[^A-Za-z0-9]+/g, '-');

export const VIEWS = [
  { id: 'inicio', label: 'Resumen para la mesa' },
  { id: 'debilidades', label: 'Debilidades expuestas' },
  { id: 'verificacion', label: 'Verificación de citas' },
  { id: 'glosario', label: 'Glosario' },
  { id: 'advertencias', label: 'Advertencias' },
  { id: 'reglamento', label: 'Reglamento de las mesas' },
];

/** Lee el hash (#eje1-p1-4). Solo letras, dígitos y guiones. */
export function parseHash(ejes) {
  const fallback = { eje: ejes[0].id, view: 'inicio' };
  const h = window.location.hash.replace(/^#/, '');
  if (!h || !/^[A-Za-z0-9-]+$/.test(h)) return fallback;
  const eje = ejes.find((e) => h === e.id || h.startsWith(e.id + '-'));
  if (!eje) return fallback;
  const view = h.slice(eje.id.length + 1) || 'inicio';
  const valid = VIEWS.some((v) => v.id === view) || eje.puntos.some((p) => slug(p.pid) === view);
  return { eje: eje.id, view: valid ? view : 'inicio' };
}

export const ejeLabel = (e) => 'Eje ' + String(e.code || e.id).replace(/\D+/g, '');

/** Términos de búsqueda normalizados (se exige que aparezcan todos). */
export function termsOf(q) {
  const n = norm(q).trim();
  if (n.length < 2) return [];
  return [...new Set(n.split(/\s+/).filter(Boolean))];
}
export const hasAll = (s, terms) => terms.length > 0 && terms.every((t) => s.includes(t));
export const hasAny = (s, terms) => terms.length > 0 && terms.some((t) => s.includes(t));

/** Índice de búsqueda: texto normalizado de cada campo, calculado una sola vez. */
// Solo los valores de texto de un objeto (sin nombres de campos), para indexarlos.
function valuesText(v) {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(valuesText).join(' ');
  if (v && typeof v === 'object') return Object.values(v).map(valuesText).join(' ');
  return '';
}

/** Tareas y recomendaciones del reglamento, en orden, con el título de su parte. */
export function reglamentoItems(reg) {
  const out = [];
  for (const p of reg?.partes || []) {
    for (const x of p.tareas || []) out.push({ ...x, parte: p.titulo, tipo: 'tarea' });
    for (const x of p.recomendaciones || []) out.push({ ...x, parte: p.titulo, tipo: 'recomendacion' });
  }
  return out;
}

/** Texto buscable de una tarea del reglamento: parte, tarea, detalle, responsable y roles. */
export function reglamentoText(x) {
  const roles = (x.roles || []).map((r) => [r.nombre, r.descripcion, r.ejemplo].join(' '));
  return [x.parte, x.t, x.detalle, x.responsable, ...roles].filter(Boolean).join(' ');
}

export function buildIndex(data) {
  const t = (h) => norm(textOf(h));
  const idx = {};
  for (const e of data.ejes) {
    idx[e.id] = {
      puntos: e.puntos.map((p) => {
        const f = {
          head: norm(p.pid + ' ' + p.resumen),
          exige: norm((p.exige || []).join(' ')),
          grupo: norm((p.grupo || []).join(' ')),
          minimo: t(p.minimo),
          dij: t(p.dij),
          nor: t(p.nor),
          rep: t(p.rep),
          cri: t(p.cri),
          // checklist: todo su texto (documentos y línea de tiempo) para que la búsqueda lo encuentre
          checklist: p.checklist ? norm(valuesText([p.checklist.documentos, p.checklist.danos, p.checklist.linea])) : '',
          // reportes de la comunidad (3.4): hallazgos y texto de cada reporte
          reportes: p.reportes ? norm(valuesText([p.reportes.hallazgos, p.reportes.items])) : '',
        };
        return { f, all: Object.values(f).join(' ') };
      }),
      deb: e.debilidades.map((c) => {
        const f = { t: t(c.t), b: t(c.b), src: t(c.src) };
        return { f, all: f.t + ' ' + f.b + ' ' + f.src };
      }),
      glos: e.glosario.map((g) => ({
        head: t(g.g) + ' ' + t(g.nota || ''),
        items: g.items.map((i) => t(i.t) + ' ' + t(i.d)),
      })),
      adv: e.advertencias.map(t),
      // reglamento de las mesas: común a todos los ejes; una entrada por tarea o recomendación
      regl: reglamentoItems(data.reglamento).map((x) => norm(reglamentoText(x))),
      intro: t(e.intro),
    };
  }
  return idx;
}

/** Cuenta coincidencias de un eje para mostrar en el índice. */
export function countMatches(ix, terms) {
  if (!terms.length) return null;
  const puntos = ix.puntos.filter((p) => hasAll(p.all, terms)).length;
  const deb = ix.deb.filter((c) => hasAll(c.all, terms)).length;
  const glos = ix.glos.reduce(
    (n, g) => n + (hasAll(g.head, terms) ? g.items.length : g.items.filter((i) => hasAll(i, terms)).length),
    0
  );
  const adv = ix.adv.filter((a) => hasAll(a, terms)).length;
  const regl = (ix.regl || []).filter((r) => hasAll(r, terms)).length;
  return { puntos, deb, glos, adv, regl, total: puntos + deb + glos + adv + regl };
}

/**
 * Resalta los términos dentro de un nodo del DOM (solo en contenedores con innerHTML propio).
 * Coincidencia sin acentos: "unigenero" resalta "UNIGÉNERO".
 */
export function highlight(root, terms) {
  if (!root) return;
  const old = root.querySelectorAll('mark.hl');
  if (old.length) {
    old.forEach((m) => m.replaceWith(document.createTextNode(m.textContent)));
    root.normalize();
  }
  if (!terms || !terms.length) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    const text = node.nodeValue;
    let ns = '';
    const map = [];
    for (let i = 0; i < text.length; i++) {
      const n = norm(text[i]);
      for (let j = 0; j < n.length; j++) { ns += n[j]; map.push(i); }
    }
    const ranges = [];
    for (const term of terms) {
      let from = 0, at;
      while ((at = ns.indexOf(term, from)) !== -1) {
        ranges.push([map[at], map[at + term.length - 1] + 1]);
        from = at + term.length;
      }
    }
    if (!ranges.length) continue;
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [ranges[0]];
    for (const r of ranges.slice(1)) {
      const last = merged[merged.length - 1];
      if (r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else merged.push(r);
    }
    const frag = document.createDocumentFragment();
    let pos = 0;
    for (const [a, b] of merged) {
      if (a > pos) frag.appendChild(document.createTextNode(text.slice(pos, a)));
      const m = document.createElement('mark');
      m.className = 'hl';
      m.textContent = text.slice(a, b);
      frag.appendChild(m);
      pos = b;
    }
    if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
    node.replaceWith(frag);
  }
}

/** Separa la tabla de verificación en filas para agruparlas por veredicto. */
export function parseVerificacion(html) {
  const t = document.createElement('template');
  t.innerHTML = html || '';
  const table = t.content.querySelector('table');
  if (!table) return { intro: html, head: null, rows: null };
  const trs = [...table.querySelectorAll('tr')];
  const hasHead = trs[0] && trs[0].querySelector('th');
  const head = hasHead ? [...trs[0].children].map((c) => c.textContent.trim()) : null;
  const rows = (hasHead ? trs.slice(1) : trs).map((tr) =>
    [...tr.children].map((td) => ({ html: td.innerHTML, text: td.textContent.trim() }))
  );
  table.remove();
  let vi = head ? head.findIndex((h) => norm(h).includes('veredicto')) : -1;
  if (vi < 0) vi = 2;
  return { intro: t.innerHTML, head, rows, vi };
}

// Veredictos: el símbolo de data.json se muestra como etiqueta de texto (sin emojis).
export const VERDICTS = [
  { sym: '✘', cls: 'bad', label: 'Incorrecta', group: 'Incorrectas: corregir antes de la mesa' },
  { sym: '⚠', cls: 'warn', label: 'Débil', group: 'Débiles: usar con cuidado' },
  { sym: '✔', cls: 'ok', label: 'Correcta', group: 'Correctas' },
  { sym: '➕', cls: 'add', label: 'Sugerencia', group: 'Sugerencias para agregar' },
];
export function verdictOf(text) {
  const s = String(text || '').trim();
  const v = VERDICTS.find((x) => s.startsWith(x.sym));
  if (!v) return { cls: 'other', label: s || 'Sin veredicto', rest: '', group: 'Otras', order: 9 };
  const rest = s.slice(v.sym.length).replace(/^️/, '').trim();
  return { ...v, rest, order: VERDICTS.indexOf(v) };
}
