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

## Estructura

- `src/lib.js`: búsqueda sin acentos, resaltado, ruteo por hash, utilidades.
- `src/components/views.jsx`: Resumen, Punto, Debilidades, Verificación, Glosario, Advertencias.
- `src/components/CitePanel.jsx`: panel de cita (frase exacta, por qué importa, abrir original).
- `public/sw.js`: copia sin conexión (red primero para `index.html` y `data.json`).
- `scripts/check-data.mjs`: validación de `data.json` (corre antes de cada build).
