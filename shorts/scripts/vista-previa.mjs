// Renderiza un fotograma por escena (a media resolución) para revisar el diseño rápido.
// Uso: node scripts/vista-previa.mjs videos/<carpeta> [carpetaSalida]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const carpeta = path.resolve(RAIZ, process.argv[2]);
const salida = path.resolve(process.argv[3] ?? path.join(carpeta, 'vista-previa'));
fs.mkdirSync(salida, {recursive: true});
const config = JSON.parse(fs.readFileSync(path.join(RAIZ, 'config.json'), 'utf8'));
const props = JSON.parse(fs.readFileSync(path.join(carpeta, 'props.json'), 'utf8'));
const serveUrl = await bundle({entryPoint: path.join(RAIZ, 'src/index.ts'), publicDir: path.join(RAIZ, 'public')});
const nav = config.navegador && fs.existsSync(config.navegador) ? config.navegador : null;
const c = {serveUrl, inputProps: props, browserExecutable: nav, chromiumOptions: {gl: 'swangle'}};
const comp = await selectComposition({...c, id: 'Short'});
for (const [i, e] of props.escenas.entries()) {
  for (const q of [0.3, 0.8]) {
    const frame = Math.min(comp.durationInFrames - 1, Math.round((e.inicio + (e.fin - e.inicio) * q) * 30));
    const out = path.join(salida, `escena${i + 1}-${Math.round(q * 100)}.png`);
    await renderStill({...c, composition: comp, frame, output: out, scale: 0.5});
    console.log(out);
  }
}
