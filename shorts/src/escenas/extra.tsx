import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Icono} from '../iconos';
import {Pildora, Sello, TextoGrande} from '../comunes';
import {C, FUENTE, TRAZO, ZONA, color} from '../tema';
import {entrada, momento} from '../util';
import type {EscenaProps} from './index';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const H = ZONA.abajo - ZONA.arriba; // alto de la zona de animación
const W = 1080;

const Pop: React.FC<{retraso?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({retraso = 0, children, style}) => {
  const f = useCurrentFrame();
  const s = entrada(f, retraso, 30, {damping: 9, mass: 0.6});
  return <div style={{transform: `scale(${s})`, opacity: Math.min(1, s * 2), ...style}}>{children}</div>;
};

/** Molécula de glucosa: hexágono amarillo */
export const Hex: React.FC<{x: number; y: number; r?: number; rot?: number; o?: number}> = ({x, y, r = 26, rot = 0, o = 1}) => {
  const pts = Array.from({length: 6}, (_, i) => {
    const a = (Math.PI / 3) * i + (rot * Math.PI) / 180;
    return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
  }).join(' ');
  return <polygon points={pts} fill={C.amarillo} stroke={C.tinta} strokeWidth={5} strokeLinejoin="round" opacity={o} />;
};

const Globulo: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse rx={58} ry={40} fill={C.rojo} stroke={C.tinta} strokeWidth={5} />
    <ellipse rx={30} ry={17} fill="#a51d2d" />
  </g>
);

const Etiqueta: React.FC<{x: number; y: number; texto: string; fondo?: string; d?: number; tam?: number}> = ({x, y, texto, fondo, d = 0, tam = 44}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)'}}>
    <Pildora texto={texto} fondo={fondo} retraso={d} tam={tam} />
  </div>
);

// ── vaso: acercamiento a un vaso sanguíneo con glóbulos rojos (y glucosa) fluyendo ──
export const Vaso: React.FC<EscenaProps> = ({v}) => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, 24], [0.55, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const cy = H / 2 + 20;
  const onda = (x: number, off: number) => cy + off + Math.sin(x / 160 + f / 30) * 18;
  const pared = (off: number) => Array.from({length: 23}, (_, i) => `${i === 0 ? 'M' : 'L'}${i * 50 - 20} ${onda(i * 50, off)}`).join(' ');
  const n = 9;
  return (
    <AbsoluteFill style={{top: ZONA.arriba, height: H}}>
      <svg width={W} height={H} style={{position: 'absolute', transform: `scale(${zoom})`, transformOrigin: '50% 55%'}}>
        <path d={`${pared(-210)} L1100 ${H} L-20 ${H} Z`} fill="#f6c7c7" opacity={0.0} />
        <rect x={-20} y={cy - 210} width={1120} height={420} fill="#f9d6d3" />
        <path d={pared(-210)} fill="none" stroke="#c94a5a" strokeWidth={26} strokeLinecap="round" />
        <path d={pared(210)} fill="none" stroke="#c94a5a" strokeWidth={26} strokeLinecap="round" />
        {Array.from({length: n}).map((_, i) => {
          const x = ((i * 157 + f * 7) % 1300) - 110;
          const y = onda(x, ((i * 53) % 220) - 110);
          return <Globulo key={i} x={x} y={y} s={0.9 + (i % 3) * 0.12} rot={(i * 37 + f * 2) % 360} />;
        })}
        {v.glucosa &&
          Array.from({length: 7}).map((_, i) => {
            const x = ((i * 191 + f * 9) % 1300) - 110;
            return <Hex key={'h' + i} x={x} y={onda(x, ((i * 71) % 260) - 130)} r={22} rot={f * 3 + i * 20} />;
          })}
      </svg>
      {v.etiqueta && <Etiqueta x={W / 2} y={70} texto={v.etiqueta} fondo={v.color ?? 'rosa'} d={10} tam={58} />}
    </AbsoluteFill>
  );
};

// ── puerta: célula con puerta; la glucosa rebota, llega la insulina (llave) y abre ──
const Llave: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <circle cx={-46} cy={0} r={30} fill={C.azul} stroke={C.tinta} strokeWidth={6} />
    <circle cx={-46} cy={0} r={11} fill="#cfe0ff" stroke={C.tinta} strokeWidth={4} />
    <rect x={-18} y={-11} width={90} height={22} rx={6} fill={C.azul} stroke={C.tinta} strokeWidth={6} />
    <rect x={44} y={8} width={14} height={24} rx={3} fill={C.azul} stroke={C.tinta} strokeWidth={5} />
    <rect x={20} y={8} width={12} height={18} rx={3} fill={C.azul} stroke={C.tinta} strokeWidth={5} />
  </g>
);

export const Puerta: React.FC<EscenaProps> = ({v, palabras, inicio, dur}) => {
  const f = useCurrentFrame();
  const conLlave = v.llave !== false;
  const resiste = !!v.resistencia;
  const tLlave = conLlave ? momento(palabras, inicio, v.claveLlave, Math.round(dur * 0.3)) : 1e9;
  const tAbre = !resiste && conLlave ? momento(palabras, inicio, v.claveAbre, tLlave + 18) : 1e9;
  const llega = interpolate(f, [tLlave, tLlave + 16], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const abre = interpolate(f, [tAbre, tAbre + 10], [0, 1], clamp);
  const cx = 660, cy = H / 2 + 30, R = 300;
  const px = cx - R + 6; // puerta sobre la membrana izquierda
  const luz = interpolate(f, [tAbre + 18, tAbre + 40], [0, 1], clamp);
  const nHex = resiste ? Math.min(14, 5 + Math.floor(Math.max(0, f - tLlave) / 8)) : 6;
  const movLlave = resiste && f > tLlave + 16 ? Math.sin((f - tLlave) * 0.9) * 14 * Math.max(0, 1 - (f - tLlave - 16) / 40) : 0;
  return (
    <AbsoluteFill style={{top: ZONA.arriba, height: H}}>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {resiste && <rect x={0} y={0} width={W} height={H} fill={C.rojo} opacity={interpolate(f, [tLlave + 20, tLlave + 60], [0, 0.12], clamp)} />}
        {luz > 0 && <circle cx={cx} cy={cy} r={R + 70 * luz} fill={C.amarillo} opacity={0.25 * luz} />}
        <circle cx={cx} cy={cy} r={R} fill={luz > 0 ? `rgb(${190 + 60 * luz},${239 - 10 * luz},${233 - 90 * luz})` : '#BDEFE9'} stroke={C.tinta} strokeWidth={TRAZO} />
        <circle cx={cx + 70} cy={cy - 20} r={70} fill={C.morado} stroke={C.tinta} strokeWidth={TRAZO} opacity={0.9} />
        {/* puerta */}
        <rect x={px - 34} y={cy - 85} width={68} height={170} rx={10} fill="#ffffff" stroke={C.tinta} strokeWidth={6} />
        <g transform={`translate(${px - 34} ${cy - 85}) scale(${1 - 0.85 * abre} 1)`}>
          <rect width={68} height={170} rx={10} fill={C.coral} stroke={C.tinta} strokeWidth={6} />
          <circle cx={50} cy={92} r={8} fill={C.tinta} />
        </g>
        {/* glucosa */}
        {Array.from({length: nHex}).map((_, i) => {
          const y0 = cy - 150 + ((i * 61) % 300);
          let x: number;
          if (abre > 0 && i < 6) {
            const t = Math.max(0, (f - tAbre - 6 - i * 4) / 30);
            const e = Math.min(1, t);
            const dentro = [cx - 120, cx + 160, cx - 60, cx + 120, cx + 20, cx - 160][i];
            x = interpolate(e, [0, 1], [px - 70, dentro]);
            return <Hex key={i} x={x} y={interpolate(e, [0, 1], [cy + (i - 2.5) * 22, cy - 160 + ((i * 97) % 320)])} rot={f * 4 + i * 30} />;
          }
          if (resiste && i >= 5) {
            // se amontonan junto a la puerta
            const col = (i - 5) % 3, fila = Math.floor((i - 5) / 3);
            return <Hex key={i} x={px - 80 - col * 52} y={cy + 120 - fila * 48} rot={i * 17} />;
          }
          const fase = ((f * 2.4 + i * 37) % 200) / 200; // ida y rebote contra la puerta
          x = px - 60 - Math.abs(Math.sin(fase * Math.PI)) * 220 - (i % 3) * 30;
          return <Hex key={i} x={x} y={y0} rot={f * 3 + i * 25} />;
        })}
        {conLlave && llega > 0 && <Llave x={interpolate(llega, [0, 1], [120, px - 110])} y={interpolate(llega, [0, 1], [60, cy])} rot={(1 - llega) * -60 + movLlave} s={1.2} />}
      </svg>
      <Etiqueta x={180} y={H - 70} texto={v.glucosa ?? 'GLUCOSA'} fondo="amarillo" d={4} />
      <Etiqueta x={cx + 60} y={cy + R - 10} texto={v.celula ?? 'CÉLULA'} fondo="turquesa" d={8} />
      {conLlave && f >= tLlave && <Etiqueta x={230} y={v.aviso ? 165 : 60} texto={v.insulina ?? 'INSULINA'} fondo="azul" d={tLlave + 4} />}
      {resiste && f >= tLlave + 22 && (
        <div style={{position: 'absolute', left: px - 100, top: cy - 230}}>
          <Sello tipo="no" tam={120} retraso={tLlave + 22} />
        </div>
      )}
      {v.aviso && f >= tLlave + 30 && <Etiqueta x={W / 2} y={70} texto={v.aviso} fondo="rojo" d={tLlave + 30} tam={46} />}
    </AbsoluteFill>
  );
};

// ── grafica: curva de glucosa que reacciona a lo que se va nombrando ──
export const Grafica: React.FC<EscenaProps> = ({v, palabras, inicio, dur}) => {
  const f = useCurrentFrame();
  const ev: any[] = (v.eventos ?? []).map((e: any, i: number) => ({...e, t: momento(palabras, inicio, e.clave, 15 + i * 20)}));
  const base = v.base ?? 0.32;
  const estable = !!v.estable;
  const nivel = (fr: number) => {
    if (estable) {
      const amp = interpolate(fr, [0, dur * 0.7], [0.28, 0.04], clamp);
      return 0.4 + Math.sin(fr / 6) * amp;
    }
    let y = base;
    for (const e of ev) {
      const dt = fr - e.t;
      if (dt < 0) continue;
      const sube = e.sube ?? 0.16;
      y += sube * Math.min(1, dt / 10) * (v.acumula ? 1 : 1 - 0.45 * Math.min(1, Math.max(0, dt - 14) / 40));
    }
    return Math.min(0.95, y);
  };
  const gx = 90, gy = v.titulo ? 230 : 120, gw = 900, gh = 470;
  const progreso = interpolate(f, [0, Math.max(30, dur - 10)], [0.08, 1], clamp);
  const N = 70;
  const puntos: string[] = [];
  for (let i = 0; i <= N; i++) {
    const q = i / N;
    if (q > progreso) break;
    const fr = (q / progreso) * f;
    const y = gy + gh - nivel(fr) * gh;
    puntos.push(`${gx + q * gw},${y}`);
  }
  const ult = puntos[puntos.length - 1]?.split(',').map(Number) ?? [gx, gy + gh];
  const nIcon = ev.length;
  const iconY = gy + gh + 110;
  return (
    <AbsoluteFill style={{top: ZONA.arriba, height: H}}>
      {v.titulo && (
        <div style={{position: 'absolute', top: 10, left: 60, right: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20}}>
          {v.icono && <Icono nombre={v.icono} tam={150} />}
          <div style={{flex: v.icono ? 1 : undefined}}>
            <TextoGrande texto={v.titulo} destacado={v.destacado} tam={v.tamTitulo ?? 62} colorMarcador={v.color} />
          </div>
        </div>
      )}
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <rect x={gx - 30} y={gy - 30} width={gw + 60} height={gh + 60} rx={30} fill="#fff" stroke={C.tinta} strokeWidth={6} />
        {v.zonaRoja && <rect x={gx} y={gy} width={gw} height={gh * 0.25} fill={C.rojo} opacity={0.14} />}
        {(estable || v.bandaVerde) && <rect x={gx} y={gy + gh * 0.5} width={gw} height={gh * 0.2} fill={C.verde} opacity={interpolate(f, [0, 20], [0, 0.35], clamp)} />}
        {[0.25, 0.5, 0.75].map((q) => (
          <line key={q} x1={gx} x2={gx + gw} y1={gy + gh * q} y2={gy + gh * q} stroke="#e7e2d8" strokeWidth={3} />
        ))}
        <polyline points={puntos.join(' ')} fill="none" stroke={estable ? '#2a9d6a' : C.coral} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={ult[0]} cy={ult[1]} r={16} fill={estable ? '#2a9d6a' : C.coral} stroke={C.tinta} strokeWidth={5} />
        {/* glucosa que sale de cada alimento hacia la curva */}
        {ev.map((e, i) =>
          e.hex === false
            ? null
            : [0, 1, 2].map((j) => {
                const t = (f - e.t - j * 3) / 16;
                if (t < 0 || t > 1) return null;
                const ix = W / 2 + (i - (nIcon - 1) / 2) * 220;
                return <Hex key={`${i}-${j}`} x={interpolate(t, [0, 1], [ix + (j - 1) * 30, ult[0]])} y={interpolate(t, [0, 1], [iconY, ult[1]])} r={18} rot={f * 5} />;
              }),
        )}
        <text x={gx + 10} y={gy + 40} fontFamily={FUENTE} fontWeight={900} fontSize={44} fill={C.tinta}>
          {v.etiqueta ?? 'GLUCOSA'}
        </text>
        {v.zonaRoja && (
          <text x={gx + gw - 10} y={gy + 40} textAnchor="end" fontFamily={FUENTE} fontWeight={800} fontSize={34} fill={C.rojo}>
            ZONA ALTA
          </text>
        )}
      </svg>
      {ev.map((e, i) => (
        <div key={i} style={{position: 'absolute', left: W / 2 + (i - (nIcon - 1) / 2) * 220 - 90, top: iconY - 90, width: 180, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          {f >= e.t && (
            <Pop retraso={e.t}>
              <Icono nombre={e.icono} tam={nIcon > 3 ? 140 : 170} />
            </Pop>
          )}
          {f >= e.t && e.etiqueta && <Pildora texto={e.etiqueta} retraso={e.t + 3} tam={34} />}
        </div>
      ))}
    </AbsoluteFill>
  );
};

export const EXTRA: Record<string, React.FC<EscenaProps>> = {vaso: Vaso, puerta: Puerta, grafica: Grafica};
