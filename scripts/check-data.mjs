// Revisa public/data.json antes de cada build. Errores = el build se detiene; avisos = solo se muestran.
// Uso: npm run check   (también corre solo con npm run build)
import { readFileSync } from 'node:fs';

const file = new URL('../public/data.json', import.meta.url);
const errors = [];
const warns = [];
let d;
try {
  d = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.error('data.json no es JSON válido:', e.message);
  process.exit(1);
}

if (!d.citas || typeof d.citas !== 'object') errors.push('Falta "citas".');
if (!Array.isArray(d.ejes) || !d.ejes.length) errors.push('Falta "ejes".');
for (const k of ['fecha', 'mesa']) if (!d[k]) warns.push(`Falta "${k}".`);

const citas = d.citas || {};
const used = new Set();
for (const e of d.ejes || []) {
  const where = `eje ${e.id}`;
  if (!/^[A-Za-z0-9]+$/.test(e.id || '')) errors.push(`${where}: "id" debe tener solo letras y dígitos.`);
  for (const k of ['code', 'title', 'puntos']) if (!e[k]) errors.push(`${where}: falta "${k}".`);
  for (const k of ['debilidades', 'glosario', 'advertencias']) if (!Array.isArray(e[k])) errors.push(`${where}: "${k}" debe ser una lista.`);
  const pids = new Set();
  for (const p of e.puntos || []) {
    const w = `${where}, punto ${p.pid}`;
    if (!p.pid) errors.push(`${where}: un punto no tiene "pid".`);
    if (pids.has(p.pid)) errors.push(`${w}: "pid" repetido.`);
    pids.add(p.pid);
    if (!p.resumen) errors.push(`${w}: falta "resumen".`);
    if (!Array.isArray(p.exige) || !p.exige.length) errors.push(`${w}: "exige" debe ser una lista de párrafos con el texto completo.`);
    if (p.grupo && !Array.isArray(p.grupo)) errors.push(`${w}: "grupo" debe ser una lista de párrafos.`);
    for (const k of ['dij', 'nor', 'rep', 'cri']) if (!p[k]) warns.push(`${w}: "${k}" vacío (no se mostrará ese desplegable).`);
    if (!p.minimo) warns.push(`${w}: sin "minimo".`);
    // reportes (opcional): cada reporte con división, carrera, laboratorio y categorías conocidas
    if (p.reportes) {
      const r = p.reportes;
      const cats = new Set((r.categorias || []).map((c) => c.id));
      if (!Array.isArray(r.items) || !r.items.length) errors.push(`${w}: reportes.items debe ser una lista con reportes.`);
      for (const it of r.items || []) {
        for (const k of ['division', 'carrera', 'laboratorio', 'texto']) if (!it[k]) errors.push(`${w}: el reporte ${it.n} no tiene "${k}".`);
        for (const c of it.cats || []) if (!cats.has(c)) errors.push(`${w}: el reporte ${it.n} usa la categoría "${c}", que no está en reportes.categorias.`);
      }
      const filas = new Set((r.items || []).map((it) => it.fila));
      for (const h of r.hallazgos || []) for (const f of h.filas || []) if (!filas.has(f)) errors.push(`${w}: el hallazgo "${h.t}" cita la fila ${f}, que no es un reporte.`);
    }
    // checklist (opcional): cada clave de daños debe existir en "citas"
    for (const dn of p.checklist?.danos || []) for (const k of dn.claves || []) {
      used.add(k);
      if (!citas[k]) errors.push(`${w}: checklist.danos usa la cita ${k}, que no está en "citas".`);
    }
  }
  const json = JSON.stringify(e);
  for (const m of json.matchAll(/data-k=\\"([^"\\]+)\\"/g)) {
    used.add(m[1]);
    if (!citas[m[1]]) errors.push(`${where}: la cita ${m[1]} se usa en el HTML pero no está en "citas".`);
  }
}
// estado.json (opcional): cada punto marcado como cumplido debe existir en data.json.
try {
  const st = JSON.parse(readFileSync(new URL('../public/estado.json', import.meta.url), 'utf8'));
  for (const [eid, list] of Object.entries(st.cumplidos || {})) {
    const e = (d.ejes || []).find((x) => x.id === eid);
    if (!e) { errors.push(`estado.json: el eje "${eid}" no existe en data.json.`); continue; }
    if (!Array.isArray(list)) { errors.push(`estado.json: "cumplidos.${eid}" debe ser una lista.`); continue; }
    for (const pid of list) if (!e.puntos.some((p) => p.pid === pid)) errors.push(`estado.json: el punto ${pid} no existe en ${eid}.`);
  }
} catch (err) {
  if (err.code !== 'ENOENT') errors.push('estado.json no es JSON válido: ' + err.message);
}

const unused = Object.keys(citas).filter((k) => !used.has(k));
if (unused.length) warns.push(`${unused.length} citas definidas no se usan en ningún botón (no es un problema).`);

for (const w of warns) console.warn('aviso:', w);
if (errors.length) {
  for (const e of errors) console.error('ERROR:', e);
  console.error(`\ndata.json tiene ${errors.length} error(es). Corrígelos antes de publicar.`);
  process.exit(1);
}
const n = (d.ejes || []).reduce((s, e) => s + e.puntos.length, 0);
console.log(`data.json OK · ${d.ejes.length} ejes · ${n} puntos · ${Object.keys(citas).length} citas · fecha ${d.fecha}`);
