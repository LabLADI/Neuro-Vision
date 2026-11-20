#!/usr/bin/env node
// Uso:  node scripts/hacer-video.mjs videos/<carpeta>   [--sin-voz] [--solo-voz] [--rapido]
//
// 1. Lee videos/<carpeta>/guion.json
// 2. Genera la voz en off con ElevenLabs (con marcas de tiempo por carácter) — se cachea
// 3. Calcula tiempos de cada palabra y cada escena -> props.json
// 4. Renderiza video.mp4 (1080x1920, 30 fps) y portada.png con Remotion
// 5. Escribe post.txt (texto + hashtags) listo para copiar

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const carpetaArg = args.find((a) => !a.startsWith('--'));
if (!carpetaArg) {
  console.error('Uso: node scripts/hacer-video.mjs videos/<carpeta>');
  process.exit(1);
}
const SIN_VOZ = args.includes('--sin-voz');
const SOLO_VOZ = args.includes('--solo-voz');
const RAPIDO = args.includes('--rapido');

const carpeta = path.resolve(RAIZ, carpetaArg);
const slug = path.basename(carpeta);
const config = JSON.parse(fs.readFileSync(path.join(RAIZ, 'config.json'), 'utf8'));
const guion = JSON.parse(fs.readFileSync(path.join(carpeta, 'guion.json'), 'utf8'));

// ── 1. Texto hablado y palabras visibles ─────────────────────────────────────
// En la narración se puede escribir [lo que se ve|lo que se pronuncia], p. ej. [GDF15|ge de efe quince]
const tokens = []; // {vis, hab, escena, ini, fin} (ini/fin = índices en el texto hablado)
let hablado = '';
const iniciosEscena = [];
guion.escenas.forEach((esc, ei) => {
  if (hablado.length) hablado += ' ';
  iniciosEscena.push(hablado.length);
  const re = /\[([^\]|]+)\|([^\]]+)\]|(\S+)/g;
  let m;
  let primero = true;
  let finAnterior = -1;
  const texto = esc.narracion.trim();
  while ((m = re.exec(texto))) {
    const vis = m[1] ?? m[3];
    const hab = m[2] ?? m[3];
    if (!primero && m.index !== finAnterior) hablado += ' ';
    primero = false;
    finAnterior = m.index + m[0].length;
    // un sustituto pegado a puntuación, p. ej. "[GDF15|ge de efe quince]."
    tokens.push({vis, hab, escena: ei, ini: hablado.length, fin: hablado.length + hab.length});
    hablado += hab;
  }
});
// Pegar puntuación suelta al token anterior (por "[X|y]." -> tokens "[..]" y ".")
for (let i = tokens.length - 1; i > 0; i--) {
  if (/^[.,;:!?…]+$/.test(tokens[i].vis) && tokens[i - 1].escena === tokens[i].escena) {
    tokens[i - 1].vis += tokens[i].vis;
    tokens[i - 1].fin = tokens[i].fin;
    tokens.splice(i, 1);
  }
}

// ── 2. Voz (ElevenLabs) con caché ────────────────────────────────────────────
const voz = {...config.voz, ...(guion.voz ?? {})};
const firma = crypto.createHash('sha1').update(JSON.stringify({hablado, voz})).digest('hex').slice(0, 12);
const audioRel = `audio/${slug}.mp3`;
const audioAbs = path.join(RAIZ, 'public', audioRel);
const alinAbs = path.join(carpeta, 'voz-alineacion.json');

let alineacion = null;
if (!SIN_VOZ) {
  const cache = fs.existsSync(alinAbs) ? JSON.parse(fs.readFileSync(alinAbs, 'utf8')) : null;
  if (cache && cache.firma === firma && fs.existsSync(audioAbs)) {
    console.log('🎙  Voz en caché (el texto no cambió)');
    alineacion = cache.alineacion;
  } else {
    console.log(`🎙  Generando voz con ElevenLabs (${hablado.length} caracteres)…`);
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz.voice_id}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'xi-api-key': process.env.ELEVENLABS_API_KEY ?? 'proxy-injected'},
      body: JSON.stringify({
        text: hablado,
        model_id: voz.modelo,
        voice_settings: {stability: voz.estabilidad, similarity_boost: voz.similitud, style: voz.estilo, use_speaker_boost: true, speed: voz.velocidad},
      }),
    });
    if (!r.ok) {
      console.error('Error de ElevenLabs:', r.status, await r.text());
      process.exit(1);
    }
    const j = await r.json();
    fs.mkdirSync(path.dirname(audioAbs), {recursive: true});
    const crudo = audioAbs.replace(/\.mp3$/, '.crudo.mp3');
    fs.writeFileSync(crudo, Buffer.from(j.audio_base64, 'base64'));
    // Volumen estándar de redes sociales (-14 LUFS)
    try {
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', crudo, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '44100', '-b:a', '192k', audioAbs]);
      fs.unlinkSync(crudo);
    } catch {
      fs.renameSync(crudo, audioAbs);
    }
    alineacion = j.alignment;
    fs.writeFileSync(alinAbs, JSON.stringify({firma, alineacion}));
  }
}

// ── 3. Tiempos de palabras y escenas ─────────────────────────────────────────
let tIni, tFin, durVoz;
if (alineacion && alineacion.characters.length === hablado.length) {
  tIni = alineacion.character_start_times_seconds;
  tFin = alineacion.character_end_times_seconds;
  durVoz = tFin[tFin.length - 1];
} else {
  if (alineacion) console.warn('⚠️  La alineación no coincide con el texto; uso tiempos estimados');
  // Estimación: ~14 caracteres por segundo
  const cps = 14;
  tIni = [...hablado].map((_, i) => i / cps);
  tFin = tIni.map((t) => t + 1 / cps);
  durVoz = hablado.length / cps;
}
if (alineacion && !SIN_VOZ) {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audioAbs]).toString().trim();
    durVoz = Math.max(durVoz, parseFloat(out));
  } catch {}
}

const palabras = tokens.map((t) => ({texto: t.vis, inicio: tIni[t.ini], fin: tFin[t.fin - 1]}));
const escenas = guion.escenas.map((_, i) => {
  const ini = i === 0 ? 0 : tIni[iniciosEscena[i]] - 0.15;
  const fin = i + 1 < guion.escenas.length ? tIni[iniciosEscena[i + 1]] - 0.15 : durVoz + config.colaSegundos;
  return {inicio: Math.max(0, ini), fin};
});
const duracion = durVoz + config.colaSegundos;

const props = {guion, audio: SIN_VOZ ? null : audioRel, palabras, escenas, duracion, marca: config.marca || undefined};
fs.writeFileSync(path.join(carpeta, 'props.json'), JSON.stringify(props, null, 1));
console.log(`⏱  Duración: ${duracion.toFixed(1)} s · ${guion.escenas.length} escenas · ${palabras.length} palabras`);
if (duracion < 30 || duracion > 90) console.warn('⚠️  La duración está fuera del rango 30–90 s; ajusta el guion.');

// ── post.txt ─────────────────────────────────────────────────────────────────
if (guion.post) {
  const tags = (guion.post.hashtags ?? []).map((h) => (h.startsWith('#') ? h : '#' + h)).join(' ');
  fs.writeFileSync(path.join(carpeta, 'post.txt'), `${guion.post.texto.trim()}\n\n${tags}\n`);
}
if (SOLO_VOZ) process.exit(0);

// ── 4. Render con Remotion ───────────────────────────────────────────────────
const {bundle} = await import('@remotion/bundler');
const {renderMedia, renderStill, selectComposition} = await import('@remotion/renderer');

const navegador = config.navegador && fs.existsSync(config.navegador) ? config.navegador : null;
console.log('📦 Empaquetando proyecto…');
const serveUrl = await bundle({entryPoint: path.join(RAIZ, 'src/index.ts'), publicDir: path.join(RAIZ, 'public')});
const comunes = {serveUrl, inputProps: props, browserExecutable: navegador, chromiumOptions: {gl: 'swangle'}};

const comp = await selectComposition({...comunes, id: 'Short'});
const salidaVideo = path.join(carpeta, 'video.mp4');
console.log(`🎬 Renderizando ${comp.durationInFrames} frames…`);
let ultimo = -1;
await renderMedia({
  ...comunes,
  composition: comp,
  codec: 'h264',
  crf: RAPIDO ? 28 : 18,
  audioBitrate: '192k',
  pixelFormat: 'yuv420p',
  outputLocation: salidaVideo,
  concurrency: config.concurrencia ?? null,
  scale: RAPIDO ? 0.5 : 1,
  onProgress: ({progress}) => {
    const p = Math.floor(progress * 20);
    if (p !== ultimo) {
      ultimo = p;
      process.stdout.write(`\r   ${'█'.repeat(p)}${'░'.repeat(20 - p)} ${Math.round(progress * 100)}%`);
    }
  },
});
console.log('');

const still = await selectComposition({...comunes, id: 'Portada'});
await renderStill({...comunes, composition: still, output: path.join(carpeta, 'portada.png')});

console.log(`\n✅ Listo en ${path.relative(process.cwd(), carpeta) || '.'}/`);
console.log('   • video.mp4   • portada.png   • post.txt');
