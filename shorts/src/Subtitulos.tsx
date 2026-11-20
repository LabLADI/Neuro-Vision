import React, {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FUENTE} from './tema';
import type {Palabra} from './tipos';
import {entrada} from './util';

// Agrupa palabras en bloques cortos (máx. 3 palabras / ~18 letras), cortando en puntuación.
const agrupar = (ps: Palabra[]) => {
  const grupos: Palabra[][] = [];
  let g: Palabra[] = [];
  for (const p of ps) {
    const largo = g.reduce((a, x) => a + x.texto.length + 1, 0) + p.texto.length;
    if (g.length && (g.length >= 3 || largo > 18)) {
      grupos.push(g);
      g = [];
    }
    g.push(p);
    if (/[.,;:!?…]$/.test(p.texto)) {
      grupos.push(g);
      g = [];
    }
  }
  if (g.length) grupos.push(g);
  return grupos;
};

export const Subtitulos: React.FC<{palabras: Palabra[]}> = ({palabras}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const grupos = useMemo(() => agrupar(palabras), [palabras]);
  let idx = -1;
  for (let i = 0; i < grupos.length; i++) {
    if (grupos[i][0].inicio <= t + 0.05) idx = i;
  }
  if (idx < 0) return null;
  const g = grupos[idx];
  const finG = g[g.length - 1].fin;
  const sig = grupos[idx + 1];
  if (t > finG + 0.6 && (!sig || sig[0].inicio > t)) return null;
  const inicioF = Math.round(g[0].inicio * fps);
  const s = entrada(frame, inicioF - 2, fps, {damping: 12, mass: 0.4});
  // Palabras largas -> letra algo más pequeña para que nunca se salgan
  const masLarga = Math.max(...g.map((p) => p.texto.length));
  const tam = Math.min(100, Math.floor(880 / (masLarga * 0.88)));
  return (
    <div
      style={{
        position: 'absolute',
        left: 50,
        right: 50,
        top: 1200,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0 34px',
        transform: `scale(${0.85 + s * 0.15})`,
      }}
    >
      {g.map((p, i) => {
        const activa = t >= p.inicio - 0.03 && (t < p.fin + 0.05 || i === g.length - 1);
        const limpio = p.texto.replace(/[.,;:]+$/, '');
        return (
          <span
            key={i}
            style={{
              fontFamily: FUENTE,
              fontWeight: 900,
              fontSize: tam,
              lineHeight: 1.15,
              textTransform: 'uppercase',
              color: activa ? C.amarillo : C.blanco,
              WebkitTextStroke: `12px ${C.tinta}`,
              paintOrder: 'stroke fill',
              textShadow: `0 8px 0 ${C.tinta}`,
              transform: activa ? 'scale(1.06)' : 'none',
              display: 'inline-block',
            }}
          >
            {limpio}
          </span>
        );
      })}
    </div>
  );
};
