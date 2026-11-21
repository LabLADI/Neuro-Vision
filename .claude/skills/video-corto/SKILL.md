---
name: video-corto
description: Crea un video corto vertical (Reel/TikTok/Short, 9:16, 30–90 s) de divulgación científica o curiosidades a partir de UNA idea, con voz en off en español (ElevenLabs), animaciones didácticas y subtítulos grandes. Entrega video.mp4 + portada.png + post.txt. Úsala cuando el usuario diga "hazme un video sobre…", "video de…", "reel de…", "short de…", o pase una idea/dato curioso para convertirlo en video.
---

# Skill: video corto de divulgación (1 idea → 1 video)

El sistema vive en `shorts/` (Remotion + ElevenLabs). Tú escribes el guion como JSON; el script hace voz, animación, subtítulos, render, portada y texto del post.

## Flujo (hazlo entero sin pedir confirmaciones intermedias)

1. **Investiga y verifica** la idea. Si es ciencia, busca la fuente primaria (estudio, revista, año). Si la afirmación del usuario es exagerada o falsa, ajústala para que sea cierta sin perder el gancho, y díselo en una línea. Nunca inventes cifras ni estudios.
2. **Elige un slug** corto (`kebab-case`, sin tildes) y crea `shorts/videos/<slug>/guion.json` (formato abajo).
3. **Renderiza**: `cd shorts && npm run video -- videos/<slug>`
   - Revisión rápida del diseño antes del render final (opcional, ~20 s): `node scripts/vista-previa.mjs videos/<slug> <carpeta_scratch>` y mira los PNG.
   - Si la duración sale fuera de 30–90 s, acorta/alarga la narración y vuelve a ejecutar.
4. **Revisa** 2–3 fotogramas del MP4 (`ffmpeg -ss <t> -i video.mp4 -frames:v 1 x.png`) para comprobar que nada se corta ni se solapa.
5. **Entrega** al usuario: `videos/<slug>/video.mp4`, `portada.png`, `post.txt` (pega el texto del post en el chat).
6. Si la sesión es un repo git, haz commit de la carpeta del video y del audio en `public/audio/`.

## Reglas de estilo del guion

- **Gancho (escena 1, ≤3 s)**: contradice una creencia común. Patrones: "X no es Y: es Z", "Todo el mundo cree X… es al revés", "Tu cuerpo hace X y no te das cuenta". Frase corta, rotunda.
- **Una sola idea**. Nada de listas de datos sueltos. Cada escena empuja la misma idea.
- Estructura típica (6–9 escenas): gancho → lo que se creía → descubrimiento/fuente → mecanismo paso a paso (2–3 escenas visuales) → giro o dato sorprendente → conclusión que reformula el gancho + CTA.
- Narración en español neutro, frases cortas, tono de amigo curioso, segunda persona cuando encaje. 130–200 palabras ≈ 55–80 s.
- **Presupuesto de voz**: plan gratis de ElevenLabs = 10 000 caracteres/mes (~10 videos). Mantén la narración total < 1100 caracteres. No regeneres la voz sin necesidad: si solo cambias `visual`, la voz se reutiliza de caché (la caché depende solo del texto hablado).
- Siglas/números difíciles de pronunciar: usa `[lo que se ve|lo que se dice]`, p. ej. `[GDF15|ge de efe quince]`, `[ADN|a de ene]`, `[COVID-19|covid diecinueve]`.
- Última escena: termina con un CTA hablado breve ("Sígueme para más ciencia que nadie te contó").

## Formato de `guion.json`

```json
{
  "titulo": "…",
  "escenas": [
    {"narracion": "Texto que se dice en esta escena.", "visual": {"tipo": "gancho", "...": "..."}, "fondo": "opcional: color"}
  ],
  "portada": {"arriba": "texto pequeño", "destacado": "FRASE GANCHO", "abajo": "pastilla roja opcional", "icono": "bebe", "logo": "opcional: marcas/ladi.png"},
  "post": {"texto": "Texto del post con fuente al final y una pregunta para comentarios.", "hashtags": ["ciencia", "…"]},
  "voz": {"voice_id": "opcional, para cambiar la voz solo en este video", "velocidad": 1.06}
}
```

Ejemplo completo y probado: `shorts/videos/nauseas-embarazo/guion.json`.

## Catálogo de escenas (`visual.tipo`)

`clave` = palabra(s) de la narración en la que debe aparecer/ocurrir algo (sincronía automática con la voz).

| tipo | Para qué | Campos |
|---|---|---|
| `gancho` | Escena 1. Mito tachado → verdad | `icono`, `sello` (`no`/`si` sobre el icono), `tachado` (el mito), `clave` (cuándo aparece la verdad), `texto`, `destacado` (parte de `texto` con marcador), `color` |
| `texto` | Afirmación + ilustración | `texto`, `destacado`, `icono`, `tam`, `tamIcono`, `colorIcono` |
| `lista` | 2–4 elementos que aparecen al nombrarlos, con ✓/✗ | `titulo`, `items: [{texto, icono, estado: "si"\|"no", clave}]` |
| `estudio` | Tarjeta de paper científico | `revista`, `anio`, `titulo`, `sello` |
| `emision` | Una fuente fabrica/libera muchas partículas | `fuente: {icono, etiqueta}`, `particula: {etiqueta, color}`, `forma` (`hex` = hexágonos), `nota: {icono, texto}`, `cantidad`, `contador: {desde, hasta, sufijo}` |
| `viaje` | Algo viaja de A a B (hormona, señal, nutriente) | `desde: {icono, etiqueta}`, `hasta: {icono, etiqueta}`, `particula: {etiqueta, color}`, `colorCamino` |
| `receptor` | Molécula encaja en receptor de membrana → efecto | `molecula: {etiqueta, color}`, `receptor: {etiqueta}`, `celula: {etiqueta}`, `efecto: {icono, texto}`, `clave` |
| `comparacion` | Dos casos lado a lado con barra de nivel (0–1) | `titulo`, `izquierda`/`derecha: {titulo, icono, valor, resultado, color, clave}` |
| `foco` | Un elemento grande con hasta 4 notas alrededor | `icono`, `etiqueta`, `notas: [{texto, clave, color}]`, `tam` |
| `cifra` | Número grande que cuenta | `numero`, `desde`, `decimales`, `sufijo`, `tamNumero`, `texto`, `destacado`, `icono`, `color` |
| `vaso` | Acercamiento a un vaso sanguíneo con glóbulos rojos fluyendo | `etiqueta`, `glucosa` (true = también hexágonos de glucosa), `color` |
| `puerta` | Célula con puerta: la glucosa rebota, llega la llave (insulina) y abre; o no abre (resistencia) | `llave` (false = sin llave), `claveLlave`, `claveAbre`, `resistencia`, `aviso`, `glucosa`, `insulina`, `celula` (textos de etiquetas) |
| `grafica` | Curva de glucosa que sube con cada cosa nombrada, o se estabiliza | `titulo`, `destacado`, `icono`, `eventos: [{clave, icono, sube, etiqueta, hex}]`, `base`, `acumula`, `estable`, `zonaRoja`, `bandaVerde`, `etiqueta` |
| `laboratorio` | Cierre promocional: logo de un laboratorio + lista de pruebas | `logo` (ruta en `public/`, p. ej. `marcas/ladi.png`), `anchoLogo`, `texto`, `destacado`, `pruebas: [..]`, `clave` (cuándo aparece la lista) |
| `cierre` | Conclusión + CTA | `texto`, `destacado`, `icono`, `cta` (texto de la pastilla o `false`) |

**Iconos dibujados** (`icono`): `azucar`, `tubo`, `luna` (dormir mal), `higado`, `pancreas`, `bebe`, `mama`, `placenta`, `cerebro`, `celula`, `molecula`/`hormona`, `nauseas`, `estomago`, `corazon`, `adn`, `bacteria`, `virus`, `lupa`, `sangre`, `reloj`, `rayo`, `mensaje`, `pastilla`. Cualquier otro valor se dibuja como **emoji** (p. ej. `"🦴"`, `"🫁"`, `"🧪"`, `"☕"`), así que cualquier tema tiene ilustración.

**Colores** (`color`, `fondo`, etc.): `coral`, `turquesa`, `amarillo`, `morado`, `azul`, `rosa`, `verde`, `rojo`, `blanco` o un hex.

Reglas visuales: textos en pantalla ≤ 8 palabras (los subtítulos ya cuentan el resto); etiquetas de pastilla ≤ 25 caracteres; `destacado` debe aparecer literalmente dentro de `texto`. Varía los tipos de escena: no repitas el mismo tipo dos veces seguidas.

## Si hace falta una escena nueva

Añádela en `shorts/src/escenas/index.tsx` (y regístrala en `ESCENAS`), o un icono SVG en `shorts/src/iconos/index.tsx` (viewBox 200×200, trazo `TRAZO` color `C.tinta`). Comprueba con `npx tsc -p .` y la vista previa.

## Configuración

`shorts/config.json`: voz (`voice_id`, modelo, velocidad…), `marca` (@usuario que sale arriba en el video y en la portada), `colaSegundos`. `npm run voces` lista voces y el saldo de caracteres. La API key de ElevenLabs la inyecta el proxy en la nube; en local se lee de la variable `ELEVENLABS_API_KEY`.

## Videos para Laboratorio LADI

Si el usuario pide cerrar con "esta y otras pruebas puedes hacerlas en Laboratorio LADI": última escena tipo `laboratorio` con `"logo": "marcas/ladi.png"` y solo pruebas que existan en el catálogo de LADI (`seed/catalogo.json` del repositorio `LabLADI/ladi-laboratorio`). Nada de precios. El logo sale de `public/logo.png` de ese repositorio y se copia a `shorts/public/marcas/ladi.png` (carpeta excluida de git porque este repositorio es público). Ejemplo: `shorts/videos/control-glucemico/guion.json`.
