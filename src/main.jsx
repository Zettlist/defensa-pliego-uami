import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/public-sans';
import '@fontsource-variable/source-serif-4';
import './styles.css';
import './motion.css';
import App from './App.jsx';

const root = createRoot(document.getElementById('root'));

function Status({ children }) {
  return <div className="status"><p>{children}</p></div>;
}

root.render(<Status>Cargando la defensa…</Status>);

// Todo el contenido viene de data.json (junto a index.html). no-cache: siempre la versión publicada.
// estado.json (opcional) marca los puntos ya cumplidos; vive aparte para que un data.json nuevo no lo borre.
const estado = fetch('./estado.json', { cache: 'no-cache' })
  .then((r) => (r.ok ? r.json() : {}))
  .catch(() => ({}));
// reglamento.json (opcional): reglamento de las mesas, común a todos los ejes; también aparte de data.json.
const reglamento = fetch('./reglamento.json', { cache: 'no-cache' })
  .then((r) => (r.ok ? r.json() : null))
  .catch(() => null);
// cronograma.json (opcional): cronograma de cada eje ({ "eje1": {...} }), arriba del resumen; también aparte.
const cronograma = fetch('./cronograma.json', { cache: 'no-cache' })
  .then((r) => (r.ok ? r.json() : null))
  .catch(() => null);

fetch('./data.json', { cache: 'no-cache' })
  .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then((data) => Promise.all([estado, reglamento, cronograma]).then(([st, reg, cro]) => {
    for (const e of data?.ejes || []) {
      e.cumplidos = new Set(st?.cumplidos?.[e.id] || []);
      if (cro?.[e.id]) e.cronograma = cro[e.id];
    }
    if (data && Array.isArray(reg?.partes)) data.reglamento = reg;
    return data;
  }))
  .then((data) => {
    if (!data || !Array.isArray(data.ejes) || !data.ejes.length) throw new Error('data.json sin ejes');
    root.render(<StrictMode><App data={data} /></StrictMode>);
  })
  .catch((err) => {
    console.error(err);
    root.render(<Status>No se pudieron cargar los datos de la defensa. Revisa la conexión y recarga la página.</Status>);
  });

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* sin modo sin conexión */ });
  });
}
