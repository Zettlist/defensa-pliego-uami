# Defensa del pliego petitorio · UAM Iztapalapa — contexto para Claude Code

Herramienta de consulta para el equipo estudiantil en las mesas de negociación del pliego petitorio
de la UAM Iztapalapa (Eje 1: Biblioteca, transparencia y rendición de cuentas; Eje 3: Seguridad,
protección civil y mantenimiento). Se usa en laptop y en celular durante las mesas.

- Sitio publicado: https://zettlist.github.io/defensa-pliego-uami/
- Repositorio: **público** (Zettlist/defensa-pliego-uami). Todo lo que se sube aquí lo puede ver
  cualquiera, incluida la autoridad. No subir datos personales (teléfonos, correos, nombres de terceros
  con señalamientos), credenciales ni archivos crudos de formularios.
- Publicación: GitHub Actions (`.github/workflows/deploy.yml`) construye y publica en GitHub Pages
  en cada push a `main` (1-2 minutos). El service worker revalida `index.html` y los JSON con el
  servidor; si alguien no ve un cambio, basta recargar (Ctrl+F5).

## Cuando el usuario escriba "Analiza el proyecto"

Es la forma de arrancar en una laptop nueva o en una sesión nueva. Hacer todo esto sin preguntar,
salvo instalar programas, y **sin modificar archivos, sin commit y sin push**:

1. **Herramientas.** Revisar que existan `git`, `node` (versión 22 o mayor), `npm` y `gh`, y que
   `gh auth status` tenga sesión iniciada. Si falta algo, decir exactamente qué instalar (por ejemplo
   `winget install Git.Git`, `winget install OpenJS.NodeJS.LTS`, `winget install GitHub.cli`) y
   pedir permiso antes de instalar. Si falta la sesión de GitHub, pedir al usuario que corra
   `gh auth login` (no escribir credenciales por él).
2. **Repositorio.** Si la carpeta actual no es este repositorio, clonarlo con
   `gh repo clone Zettlist/defensa-pliego-uami` y trabajar dentro de `defensa-pliego-uami`.
   Si ya lo es, `git pull` para traer lo último. Si hay cambios sin commit, no tocarlos y avisar.
3. **Identidad de git** (solo si no está configurada en el repo):
   `git config user.name "Zettlist"` y
   `git config user.email "169029606+Zettlist@users.noreply.github.com"`.
4. **Dependencias y validación.** `npm ci` (o `npm install`), `npm run check` y `npm run build`.
   Reportar cualquier ERROR con el texto exacto.
5. **Contexto.** Leer este archivo completo, `docs/historial.md` y los últimos commits
   (`git log --oneline -10`).
6. **Prueba.** Levantar `npm run preview` (configuración `preview` de `.claude/launch.json`), abrir
   `http://localhost:4173/#eje3-reglamento` y `#eje3-p3-4`, y confirmar que cargan sin errores en la
   consola. Confirmar también que https://zettlist.github.io/defensa-pliego-uami/ responde y que su
   `data.json` es igual al del repositorio.
7. **Reporte al usuario**, breve y en español:
   - si quedó todo listo o qué falta;
   - versión de los datos (`fecha` de data.json), número de puntos y citas (lo dice `npm run check`);
   - últimos cambios y pendientes de `docs/historial.md`;
   - cómo seguir: "Publica este data.json nuevo: <ruta>", "marca el X como cumplido", "en el
     Reglamento agrega…".

## Comunicación con el usuario
- Siempre en español. Tono sobrio, de herramienta de trabajo. Nada de emojis en la app.
- El usuario no es programador: explicar en términos simples qué cambió y dónde verlo, con la liga.
- Antes de cambios grandes o de estructura, proponer y esperar aprobación. Si pide "no hagas push",
  respetarlo; si pide publicar, hacer push y verificar en vivo.

## Stack y comandos
Vite 5 + React 18 (JSX, sin TypeScript), sitio estático con rutas relativas (`base: './'`) y ruteo
por hash. Fuentes self-hosted (@fontsource: Public Sans y Source Serif 4).

```powershell
npm install
npm run dev       # http://localhost:5173
npm run check     # valida data.json, estado.json y reglamento.json (también corre antes de build)
npm run build     # genera dist/
npm run preview   # sirve dist/ en http://localhost:4173
```

`.claude/launch.json` trae las configuraciones `dev` y `preview` para el panel de vista previa.

## Archivos de contenido (nunca escribir contenido dentro de los componentes)

| Archivo | Qué tiene | Quién lo edita |
|---|---|---|
| `public/data.json` | Todo el contenido de los ejes: puntos, citas, debilidades, verificación, glosario, advertencias, checklists y reportes | Lo genera el chat de claude.ai; aquí solo se publica (o se fusiona por script cuando el usuario lo pide) |
| `public/estado.json` | Puntos ya cumplidos: `{"cumplidos": {"eje1": ["1.1.a", ...]}}` | Se edita aquí ("marca el 1.2 como cumplido") |
| `public/reglamento.json` | Reglamento de las mesas: `partes[]` con `color` (azul, verde, ambar, gris), `etiqueta` opcional, `tareas[]` con `t`, `detalle`, `responsable` y `roles[]` (`nombre`, `descripcion`, `ejemplo`) | Se edita aquí |
| `public/cronograma.json` | Cronograma de cada eje, arriba del Resumen para la mesa: `{"eje1": {titulo, fuente, aviso, roles[], pasos[] (t, detalle, etiqueta, listas[], firmantes[]), estrategia[], contrarespuesta[], otros[]}}` | Se edita aquí |

`estado.json`, `reglamento.json` y `cronograma.json` van **aparte** a propósito: así un `data.json` nuevo del chat no los
borra. `main.jsx` los carga y los junta (`e.cumplidos`, `data.reglamento`, `e.cronograma`).

### Estructura de data.json (resumen)
```
{ fecha, mesa,
  citas: { "E1:R1": { p: "frase exacta", n: "por qué importa" }, ... },
  ejes: [ { id: "eje1"|"eje3", code, title, full, intro (HTML),
    puntos: [ { pid, resumen, exige: [párrafos, texto completo del pliego], grupo?,
                dij, nor, rep, cri, minimo (HTML), nd, nn (número de citas en dij / nor),
                checklist?: { titulo, estados, documentos[], danos[] (3.1) | linea[] + titulo_linea (3.2–3.8), vigencia_constancia? },
                reportes?: { titulo, fuente, categorias[], hallazgos[], advertencias[], items[] } (solo 3.4) } ],
    debilidades: [ { t, b, src } ], verificacion (HTML), glosario: [ { g, nota, items: [ { t, d } ] } ],
    advertencias: [HTML] } ] }
```
Citas en el HTML: `<button class="cite" data-k="E3:A21" data-u="url#page=N" data-s="uam|drive" data-p="N"><b>A21</b><span>Etiqueta</span></button>`
(abre el panel de cita) y `<a class="cite web" href target="_blank">` (fuente de internet).
Las citas de Drive apuntan al archivo (`/file/d/ID/view`); si apuntaran a una carpeta, el botón lo dice.

## Flujos habituales

**"Publica este data.json nuevo: <ruta>"**
1. Copiar a `public/data.json` sin modificar el contenido (comprobar con `cmp`).
2. `npm run check`, revisar con `git diff --stat` y comparar qué cambió respecto a la versión anterior.
3. Revisar en `npm run dev` / `preview` lo que el usuario pida (escritorio y 390 px), consola sin errores.
4. Si algo se ve mal, arreglar solo CSS o componentes, nunca el JSON (salvo que el usuario lo pida).
5. Commit con el mensaje que indique el usuario, push, esperar `gh run watch` y verificar que el
   `data.json` publicado sea idéntico al local.
`actualizar.ps1 "<ruta>"` hace copia + check + commit + push en un paso.

**Fusionar cambios parciales (propuestas JSON del chat)**: hacer respaldo
`public/data.backup-*.json` (está en `.gitignore`), fusionar con un script (no a mano), no pisar
citas existentes con contenido distinto sin avisar, validar que cada `data-k` exista en `citas`, que
`nd`/`nn` coincidan con los botones, que las etiquetas W apunten siempre a la misma URL, y confirmar
que el resto del archivo quedó idéntico.

**Reportes de la comunidad (3.4)**: 97 reportes (filas 2–29 de la hoja "Evidencias laboratorios" y
filas 31–100 del formulario "Reportes sobre Laboratorios UAM-I", con `origen: "formulario"`). Antes de
publicar testimonios: quitar teléfonos, nombres o descripciones de personas concretas, y anotarlo en
las advertencias. No subir el CSV crudo al repositorio.

**Marcar puntos cumplidos**: agregar el pid a `public/estado.json`; `npm run check` valida que exista.

**Reglamento**: editar `public/reglamento.json`; se ve en `#eje1-reglamento` / `#eje3-reglamento`
(Panorama). Los responsables se muestran como etiquetas.

## Mapa del código
- `src/main.jsx`: carga data.json + estado.json + reglamento.json; registra `public/sw.js` en producción.
- `src/App.jsx`: ruteo por hash (`#eje3-p3-4`, `#eje1-debilidades`), búsqueda, modo mesa
  (localStorage `defensa-pliego.mesa`), atajos (`/` busca, flechas cambian de punto), panel de cita.
- `src/lib.js`: normalización sin acentos, índice de búsqueda, `VIEWS`, `parseHash`, resaltado.
- `src/components/views.jsx`: Resumen, Punto, Debilidades, Verificación, Glosario, Advertencias, Reglamento.
- `src/components/Checklist.jsx`: checklist por punto (estado editable en localStorage `checklist:<pid>`, exportable).
- `src/components/Reportes.jsx`: reportes del 3.4 (Hallazgos · Tabla dinámica · Por división).
- `src/components/CitePanel.jsx`, `Collapsible.jsx`, `Nav.jsx`, `Rich.jsx`, `useFolds.js`, `fx.jsx`, `icons.jsx`.
- `src/styles.css` (tokens en `:root`, modo oscuro por `prefers-color-scheme`), `src/motion.css` (animaciones).
- `scripts/check-data.mjs`: errores detienen el build; avisos solo se muestran.

## Convenciones de git
- Identidad local del repo: `git config user.name "Zettlist"` y
  `git config user.email "169029606+Zettlist@users.noreply.github.com"` (configurar en cada laptop nueva).
- Mensajes de commit en español. Terminar con la línea de co-autoría que indique la sesión.
- No hacer commit de `node_modules/`, `dist/` ni respaldos.

## Historial y contexto
- `docs/contexto-inicial.md`: el brief original del proyecto (17-nov-2026).
- `docs/historial.md`: qué se hizo y qué se decidió en cada etapa.
