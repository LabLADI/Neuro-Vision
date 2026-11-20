import {interpolate, spring} from 'remotion';
import {FPS} from './tema';
import type {Palabra} from './tipos';

export const entrada = (frame: number, retraso = 0, fps = FPS, config: any = {damping: 12, mass: 0.6}) =>
  spring({frame: frame - retraso, fps, config});

export const aparecer = (frame: number, retraso = 0, dur = 10) =>
  interpolate(frame, [retraso, retraso + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const normal = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');

/**
 * Devuelve el frame (relativo a la escena) en que se dice por primera vez `clave`.
 * Si no se encuentra, devuelve `porDefecto`.
 */
export const momento = (palabras: Palabra[], inicioEscena: number, clave: string | undefined, porDefecto: number) => {
  if (!clave) return porDefecto;
  const objetivo = clave.split(/\s+/).map(normal).filter(Boolean);
  if (!objetivo.length) return porDefecto;
  for (let i = 0; i < palabras.length; i++) {
    const ok = objetivo.every((o, j) => palabras[i + j] && normal(palabras[i + j].texto).startsWith(o));
    if (ok) return Math.max(0, Math.round((palabras[i].inicio - inicioEscena) * FPS) - 3);
  }
  return porDefecto;
};
