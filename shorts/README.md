# Shorts de ciencia — 1 idea → 1 video

Generador de videos verticales (9:16, 1080×1920, 30–90 s) de divulgación científica:
gancho que contradice una creencia, una sola idea, animaciones didácticas, voz en off
en español (ElevenLabs) y subtítulos grandes sincronizados palabra a palabra.

## Uso diario (con Claude Code)

Abre Claude Code en este repositorio y escribe:

> Hazme un video sobre: *"Tu hígado se regenera entero aunque te quiten el 70 %"*

Claude usa la skill `.claude/skills/video-corto` y te devuelve en `videos/<slug>/`:

| archivo | qué es |
|---|---|
| `video.mp4` | Video final listo para Reels / TikTok / Shorts |
| `portada.png` | Portada 1080×1920 |
| `post.txt` | Texto del post con fuente y hashtags |
| `guion.json` | Guion editable (escenas + narración) |

Para pedir cambios: "cambia la escena 3 por una cifra", "hazlo más corto", "otra voz"…
Si solo cambian las animaciones, la voz se reutiliza y no gasta caracteres de ElevenLabs.

## Comandos

```bash
npm install                                   # una vez
npm run video -- videos/<slug>                # voz + render + portada + post
npm run video -- videos/<slug> --rapido       # borrador a media resolución
npm run video -- videos/<slug> --sin-voz      # prueba sin gastar caracteres
node scripts/vista-previa.mjs videos/<slug>   # PNG de cada escena (~20 s)
npm run studio                                # editor visual de Remotion en el navegador
npm run voces                                 # voces disponibles y saldo de caracteres
```

## Configuración (`config.json`)

- `voz.voice_id`: voz de ElevenLabs (por defecto *Sarah*, modelo `eleven_multilingual_v2`).
- `voz.velocidad`: 0.7–1.2 (por defecto 1.06).
- `marca`: tu @usuario, aparece arriba del video y en la portada.
- `navegador`: Chrome para el render; si la ruta no existe, Remotion descarga el suyo.

## Ejecutarlo en tu ordenador

Necesitas Node 18+ y ffmpeg. Exporta tu clave: `export ELEVENLABS_API_KEY=...`
(en la nube de Claude Code la clave ya la inyecta el proxy).

## Estructura

```
src/escenas/   plantillas animadas (gancho, lista, estudio, viaje, receptor, comparación…)
src/iconos/    ilustraciones SVG (bebé, placenta, cerebro, célula, ADN…) + emoji de respaldo
src/Subtitulos.tsx   subtítulos karaoke
scripts/hacer-video.mjs   pipeline completo
videos/<slug>/  un video por carpeta
```
