# Contexto: web "Defensa del pliego petitorio · UAM Iztapalapa" (Ejes 1 y 3)

## Qué es
Página web interactiva de consulta para el equipo estudiantil que negocia el pliego petitorio de la UAM Iztapalapa en la **mesa de diálogo del 23 de noviembre de 2026**. Cubre el **Eje 1** (Biblioteca, transparencia y rendición de cuentas; puntos 1.1.a–1.1.f, 1.2–1.6) y el **Eje 3** (Seguridad, protección civil y mantenimiento; puntos 3.1–3.8).

Objetivo de esta etapa: rehacer la página en **React** (al usuario no le gustó cómo se veía la versión en HTML plano). Cada actualización de contenido debe poder publicarse como un nuevo despliegue en la misma liga.

## Archivos que acompañan este contexto
- `data.json`: **fuente única de contenido** (≈190 KB). Lo genera la investigación y no debe editarse a mano salvo correcciones puntuales.
- `index.html`: borrador de la versión React (React 18.3.1 UMD + htm 3.1.1 desde CDN, sin build). Carga `data.json` con `fetch`. **No se ha probado en navegador todavía.**
- `Defensa_Eje1_UAMI_v3_completo.pdf`, `Defensa_Eje3_UAMI_v3_completo.pdf` (en Descargas/Drive): versión con PDFs subrayados; la web no puede incluir PDFs y enlaza a los originales.

## Estructura de `data.json`
```
{
  fecha: "17-11-2026", mesa: "23 de noviembre de 2026",
  citas: { "E1:R1": {p: "frase exacta en el documento" | null, n: "por qué importa"}, ... }  // 195 citas
  ejes: [ {
    id: "eje1" | "eje3", code: "E1" | "E3", title, full,
    intro: HTML (fuentes y definición de plazos Corto/Mediano/Largo),
    puntos: [ {
      pid: "1.1.a", resumen: "texto corto",
      exige: [párrafos]  // TEXTO COMPLETO del pliego: el usuario pidió explícitamente no resumirlo
      grupo?: [párrafos] // solo 1.1.x: encabezado común del punto 1.1
      dij: HTML  // "Lo que dijeron ellos": evidencia con citas
      nor: HTML  // "Norma que los obliga"
      rep: HTML  // "Lo que dirán · réplica"
      cri: HTML  // criterios Corto/Mediano/Largo
      minimo: HTML // "Mínimo aceptable"
      nd, nn: número de citas en dij / nor
    } ],
    debilidades: [ {t: título, b: HTML, src: HTML de citas} ],
    verificacion: HTML (párrafo + tabla de citas del pliego con veredicto ✔ ✘ ⚠ ➕),
    glosario: [ {g: grupo, nota, items: [{t, d}]} ],
    advertencias: [HTML]
  } ]
}
```
Las citas dentro del HTML vienen así:
```html
<button type="button" class="cite" data-k="E1:A21" data-u="https://...Acta_457.pdf#page=24" data-s="uam|drive" data-p="24"><b>A21</b><span>Acta 457 p.24</span></button>
<a class="cite web" href="https://..." target="_blank"><b>W9</b><span>Patronato, sesión 405</span></a>
```
- Botón `cite`: al hacer clic se abre un panel lateral con `citas[data-k].p` (frase resaltada), `citas[data-k].n` (nota) y un botón para abrir `data-u` (original UAM en la página `data-p`, o la carpeta de Drive si `data-s="drive"`).
- `a.cite.web`: fuente de internet, se abre directo.
- Clases que ya trae el HTML: `.src` (fila de citas), `.k` + `.t.tc/.tm/.tl` (etiquetas Corto/Mediano/Largo), `.nota`, `.nota2`.

## Requisitos de diseño y funciones (pedidos por el usuario o ya acordados)
1. **"Lo que exigimos" completo**, sin resumir, siempre visible.
2. **Los demás apartados son desplegables** (dijeron, norma, réplica, criterios; también debilidades, verificación, glosario y advertencias).
3. Pestañas o selector **Eje 1 / Eje 3**; ruteo por hash (`#eje1-p1-4`, `#eje3-debilidades`). Solo se permite `#nombre` con letras, dígitos y guiones.
4. **Panel de cita** (la frase exacta + por qué importa + abrir el original en la página).
5. **Buscador** que filtra puntos, tarjetas, glosario y advertencias, sin distinguir acentos.
6. **Modo mesa**: muestra solo exigencia + mínimo aceptable + réplica + criterios, en letra grande.
7. Vista **"Resumen para la mesa"**: cada punto con su mínimo aceptable.
8. Debe verse bien en celular (el equipo lo consulta en la mesa) y en tema claro/oscuro.
9. Idioma: español. Tono sobrio, de herramienta de trabajo; nada de emojis.
10. Formato que prefiere el usuario para reportar hallazgos: "Pizarrón" (título + contenido breve con fuente: documento y página) y después "Profundización".

## Restricciones de hosting (si se publica como artifact de claude.ai)
- CSP: scripts solo de cdnjs.cloudflare.com, cdn.jsdelivr.net/npm, unpkg.com; fuentes de Google Fonts. Nada de `fetch` a otros dominios.
- No se pueden publicar PDFs.
- Sin `alert`, `window.open` ni descargas; enlaces externos con `<a href target="_blank">`.
- localStorage solo para preferencias (p. ej., modo mesa).
- Liga actual del artifact (versión HTML anterior): https://claude.ai/artifact/8KjqzuVyBiiq9Krh37XydK (slug `3b4dc334-e265-46d1-b5a5-b7a12c1868ea`, versión `1794977545-d191`). Para seguir publicando en esa misma liga hay que hacerlo desde el chat de claude.ai, o desde Claude Code si tiene conectado el servidor de artifacts. Si no, se puede desplegar el sitio estático (`index.html` + `data.json`) en GitHub Pages, Vercel o Netlify.

## Estado de la investigación (se sigue en el chat de claude.ai)
- Eje 1 actualizado con:
  - **1.3 CELEX/COSIB**: Actas 457, 459, 523, 498, 445, 478 y 429; denuncia de cobros de 2019.
  - **1.4 vehículos**: actas del Patronato 405/408/409/411; Acuerdo 03/2026 (compra del auto por el funcionario al 30% de la factura y fondo revolvente); Acuerdo 11/2024; Boletín 882.
- **Pendiente:** leer el PDF escaneado del Acuerdo 03/2026 para citar los numerales exactos, y buscar los Acuerdos 10/2014 y 07/2018 y la observación de la Contraloría de 2022.
- Cuando cambie el contenido se regenerará `data.json`; la app no debe tener contenido incrustado en el código.
