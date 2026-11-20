import {continueRender, delayRender, registerRoot} from 'remotion';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import {Root} from './Root';

const h = delayRender('Cargando fuentes');
// Carga TODAS las variantes (incluidos todos los subconjuntos de emoji) antes del primer fotograma
Promise.all(
  Array.from(document.fonts as unknown as Iterable<FontFace>)
    .filter((f) => /Montserrat/.test(f.family))
    .map((f) => f.load().catch(() => undefined)),
)
  .catch(() => undefined)
  .then(() => continueRender(h));

registerRoot(Root);
