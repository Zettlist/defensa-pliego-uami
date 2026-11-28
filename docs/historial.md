# Historial del proyecto

Qué se hizo y qué se decidió en cada etapa (noviembre de 2026). El detalle de cada cambio está en
`git log`.

## 17-nov · Primera versión
- Se rehízo en Vite + React la página que antes era HTML plano. Todo el contenido sale de
  `public/data.json`; el código no trae texto del pliego ni de las citas.
- Funciones: selector Eje 1 / Eje 3 con ruteo por hash, "Resumen para la mesa", vista de punto
  ("Lo que exigimos" completo y siempre visible, mínimo aceptable resaltado, desplegables para
  dijeron / norma / réplica / criterios), Debilidades, Verificación, Glosario, Advertencias, panel de
  cita, búsqueda sin acentos, modo mesa, tema claro/oscuro, menú en select para celular.
- Se eligió GitHub Pages público. Se advirtió que la autoridad también puede ver mínimos y réplicas.
- Service worker: red primero (con revalidación) para `index.html` y los JSON; así cada publicación
  se ve al recargar.
- Flujo acordado para actualizar: el chat de claude.ai genera `data.json`, el usuario lo descarga y
  pide en Claude Code "Publica este data.json nuevo: <ruta>".

## 18-nov · Ajustes de contenido y presentación
- 1.5: tablas de 4+ columnas con scroll horizontal propio en celular; citas apiladas en las celdas.
- Se quitaron las tarjetas de cifras del resumen (no aportaban).
- Citas de Drive D1–D20: ahora abren cada archivo; el botón distingue archivo de carpeta.
- Puntos cumplidos (1.1.a–1.1.f) en `public/estado.json`, aparte de `data.json`, para que una
  publicación nueva no los borre. Insignia "Cumplido" en resumen, índice y encabezado del punto.

## 19-nov · Eje 3 completo
- 3.1–3.8 con contenido nuevo, 58 citas nuevas, H2 corregida; N16 y N17 reemplazadas con permiso
  del usuario (su contenido anterior ya no se usaba).
- Checklist por punto (plegable): documentos por edificio con estado editable (localStorage,
  exportable a JSON) y línea de tiempo (`danos` en 3.1, `linea` en 3.2–3.8).

## 24-nov · Reportes de laboratorios (3.4)
- Se aplicó el patch de "Reportes de la comunidad – Laboratorios" (Hallazgos, Tabla dinámica,
  Reportes por división) con los 28 reportes de la hoja "Evidencias laboratorios".
- Se sumaron 69 reportes del formulario "Reportes sobre Laboratorios UAM-I" (97 en total). La
  clasificación de los nuevos (resumen, edificio, categorías) la hizo Claude y conviene que el
  equipo la revise. Se quitaron un teléfono y referencias a dos personas antes de publicar.

## 25-nov · Reglamento de las mesas
- Nueva vista "Reglamento de las mesas" en Panorama (ambos ejes), con contenido en
  `public/reglamento.json`: Dentro (azul), Fuera (verde), Durante (ámbar) y Recomendaciones (gris).
- Roles de mesa (Combativo, Facilitador, Negociador, Integrador) en desplegables con ejemplo.
- Responsables como etiquetas: Ric, Pyro, Faby, Diego (Biología), Alondra.

## Pendiente o por revisar
- `fecha` de `data.json` sigue en 24-11-2026; se cambia en el chat que genera el archivo.
- Revisar la clasificación de los 69 reportes nuevos del 3.4.
- La hoja "Evidencias laboratorios" se llena a mano y va recorrida respecto al formulario; los
  reportes del formulario muestran "Formulario, fila N" sin enlace.
