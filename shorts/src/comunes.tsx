import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, FUENTE, TRAZO, color} from './tema';
import {entrada} from './util';

export const Fondo: React.FC<{tono?: string}> = ({tono}) => {
  const f = useCurrentFrame();
  const base = tono ?? C.fondo;
  return (
    <AbsoluteFill style={{background: base}}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{position: 'absolute', opacity: 0.55}}>
        <circle cx={150 + Math.sin(f / 60) * 40} cy={300 + Math.cos(f / 70) * 30} r={260} fill={C.fondo2} />
        <circle cx={950 + Math.cos(f / 50) * 40} cy={1000 + Math.sin(f / 65) * 40} r={320} fill={C.fondo2} />
        <circle cx={300 + Math.sin(f / 80) * 30} cy={1700} r={220} fill={C.fondo2} />
        {Array.from({length: 18}).map((_, i) => (
          <circle key={i} cx={(i * 197) % 1080} cy={(i * 331 + f * (0.4 + (i % 3) * 0.2)) % 1920} r={6 + (i % 4) * 3} fill={C.tinta} opacity={0.06} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** Texto grande; las palabras de `destacado` (si aparecen en el texto) se resaltan con un marcador. */
export const TextoGrande: React.FC<{texto: string; destacado?: string; tam?: number; colorMarcador?: string; retraso?: number; alinear?: 'center' | 'left'}> = ({
  texto,
  destacado,
  tam = 88,
  colorMarcador,
  retraso = 0,
  alinear = 'center',
}) => {
  const f = useCurrentFrame();
  const partes = destacado && texto.includes(destacado) ? texto.split(destacado) : [texto];
  const s = entrada(f, retraso);
  const marc = interpolate(f, [retraso + 8, retraso + 22], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        fontFamily: FUENTE,
        fontWeight: 900,
        fontSize: tam,
        lineHeight: 1.12,
        color: C.tinta,
        textAlign: alinear,
        letterSpacing: -1,
        opacity: s,
        transform: `translateY(${(1 - s) * 40}px) scale(${0.9 + s * 0.1})`,
      }}
    >
      {partes.length > 1 ? (
        <>
          {partes[0]}
          <span
            style={{
              backgroundImage: `linear-gradient(${color(colorMarcador, C.amarillo)}, ${color(colorMarcador, C.amarillo)})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${marc}% 45%`,
              backgroundPosition: '0 85%',
              padding: '0 6px',
            }}
          >
            {destacado}
          </span>
          {partes.slice(1).join(destacado)}
        </>
      ) : (
        texto
      )}
    </div>
  );
};

export const Pildora: React.FC<{texto: string; fondo?: string; tam?: number; retraso?: number; style?: React.CSSProperties}> = ({texto, fondo, tam = 46, retraso = 0, style}) => {
  const f = useCurrentFrame();
  const s = entrada(f, retraso, 30, {damping: 10, mass: 0.5});
  return (
    <div
      style={{
        display: 'inline-block',
        fontFamily: FUENTE,
        fontWeight: 800,
        fontSize: tam,
        color: C.tinta,
        background: color(fondo, C.blanco),
        border: `${TRAZO - 2}px solid ${C.tinta}`,
        borderRadius: 999,
        padding: `${tam * 0.22}px ${tam * 0.6}px`,
        boxShadow: `0 8px 0 ${C.tinta}`,
        transform: `scale(${s})`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {texto}
    </div>
  );
};

/** Sello circular de ✗ o ✓ */
export const Sello: React.FC<{tipo: 'si' | 'no'; tam?: number; retraso?: number}> = ({tipo, tam = 110, retraso = 0}) => {
  const f = useCurrentFrame();
  const s = entrada(f, retraso, 30, {damping: 8, mass: 0.5});
  const c = tipo === 'si' ? C.verde : C.rojo;
  return (
    <svg width={tam} height={tam} viewBox="0 0 100 100" style={{transform: `scale(${s}) rotate(${(1 - s) * -40}deg)`, overflow: 'visible'}}>
      <circle cx={50} cy={50} r={44} fill={c} stroke={C.tinta} strokeWidth={7} />
      {tipo === 'si' ? (
        <path d="M28 52 L 44 68 L 74 34" stroke="#fff" strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <g stroke="#fff" strokeWidth={11} strokeLinecap="round">
          <line x1={32} y1={32} x2={68} y2={68} />
          <line x1={68} y1={32} x2={32} y2={68} />
        </g>
      )}
    </svg>
  );
};
