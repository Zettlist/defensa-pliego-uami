# Defensa del pliego petitorio · UAM Iztapalapa

Herramienta de consulta para la mesa de diálogo (Ejes 1 y 3). Vite + React, sitio estático.
**Todo el contenido está en `public/data.json`**; el código no trae texto del pliego.

## Desarrollo

```powershell
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/ (index.html + assets + data.json)
npm run preview    # sirve dist/ en http://localhost:4173
npm run check      # revisa la estructura de data.json
```

`dist/` funciona en cualquier hosting estático y en cualquier subcarpeta (rutas relativas, ruteo por hash).

## Publicar un data.json nuevo

1. Guarda el `data.json` nuevo (por ejemplo, en Descargas).
2. En esta carpeta, en PowerShell:

   ```powershell
   .\actualizar.ps1 "$HOME\Downloads\data.json"
   ```

   El script copia el archivo a `public/`, lo valida, hace commit y push. GitHub Actions
   construye y publica en la misma liga en 1-2 minutos (pestaña *Actions* del repositorio).
3. Si `npm run check` marca ERROR, no se publica nada: corrige el JSON y repite.

Sin GitHub (Netlify Drop): `npm run build` y arrastra la carpeta `dist` a https://app.netlify.com/drop
(en el mismo sitio, desde *Deploys*, para conservar la liga).

## Otros archivos de contenido

- `public/estado.json`: puntos ya cumplidos (insignia "Cumplido").
- `public/reglamento.json`: reglamento de las mesas (vista *Reglamento de las mesas* en Panorama).

Van aparte de `data.json` para que publicar un `data.json` nuevo no los borre.

## Pasar el proyecto a otra laptop

1. Instala [Git](https://git-scm.com/download/win), [Node.js 22](https://nodejs.org/) y
   [GitHub CLI](https://cli.github.com/). Luego, en PowerShell:

   ```powershell
   gh auth login
   ```

2. Clona el repositorio y prepara la carpeta:

   ```powershell
   gh repo clone Zettlist/defensa-pliego-uami
   ```

   ```powershell
   cd defensa-pliego-uami
   ```

   ```powershell
   git config user.name "Zettlist"
   ```

   ```powershell
   git config user.email "169029606+Zettlist@users.noreply.github.com"
   ```

   ```powershell
   npm install
   ```

3. Comprueba que todo funciona:

   ```powershell
   npm run build
   ```

4. Abre esa carpeta en Claude Code. `CLAUDE.md` le da todo el contexto (cómo publicar, qué archivos
   van aparte y las reglas acordadas); `docs/historial.md` resume qué se hizo en cada etapa.

## Estructura

- `src/lib.js`: búsqueda sin acentos, resaltado, ruteo por hash, utilidades.
- `src/components/views.jsx`: Resumen, Punto, Debilidades, Verificación, Glosario, Advertencias, Reglamento.
- `src/components/Checklist.jsx` y `Reportes.jsx`: checklist por punto y reportes de laboratorios (3.4).
- `src/components/CitePanel.jsx`: panel de cita (frase exacta, por qué importa, abrir original).
- `public/sw.js`: copia sin conexión (red primero para `index.html` y los JSON).
- `scripts/check-data.mjs`: validación de `data.json`, `estado.json` y `reglamento.json` (corre antes de cada build).
