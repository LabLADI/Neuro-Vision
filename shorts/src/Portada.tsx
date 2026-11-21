import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Fondo} from './comunes';
import {Icono} from './iconos';
import {C, FUENTE} from './tema';
import type {Props} from './tipos';

export const Portada: React.FC<Props> = ({guion, marca}) => {
  const p = guion.portada ?? {destacado: guion.titulo};
  const linea: React.CSSProperties = {fontFamily: FUENTE, fontWeight: 900, textAlign: 'center', color: C.tinta, lineHeight: 1.05, letterSpacing: -2};
  return (
    <AbsoluteFill>
      <Fondo />
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 70px', gap: 50}}>
        {p.arriba && <div style={{...linea, fontSize: 84}}>{p.arriba}</div>}
        <Icono nombre={p.icono ?? 'celula'} tam={560} />
        <div
          style={{
            ...linea,
            fontSize: 112,
            textTransform: 'uppercase',
            color: C.amarillo,
            WebkitTextStroke: `16px ${C.tinta}`,
            paintOrder: 'stroke fill',
            textShadow: `0 12px 0 ${C.tinta}`,
            transform: 'rotate(-2deg)',
          }}
        >
          {p.destacado}
        </div>
        {p.abajo && <div style={{...linea, fontSize: 64, background: C.coral, color: '#fff', padding: '12px 36px', borderRadius: 24, border: `8px solid ${C.tinta}`}}>{p.abajo}</div>}
      </AbsoluteFill>
      {(p as any).logo && <Img src={staticFile((p as any).logo)} style={{position: 'absolute', bottom: 110, left: '50%', width: 420, transform: 'translateX(-50%)'}} />}
      {marca && <div style={{position: 'absolute', bottom: 120, width: '100%', textAlign: 'center', fontFamily: FUENTE, fontWeight: 800, fontSize: 44, color: C.tinta, opacity: 0.6}}>{marca}</div>}
    </AbsoluteFill>
  );
};
