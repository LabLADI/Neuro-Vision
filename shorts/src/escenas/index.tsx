import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Icono} from '../iconos';
import {Pildora, Sello, TextoGrande} from '../comunes';
import {C, FUENTE, TRAZO, ZONA, color} from '../tema';
import type {Palabra, Visual} from '../tipos';
import {aparecer, entrada, momento} from '../util';

export type EscenaProps = {v: Visual; palabras: Palabra[]; inicio: number; dur: number};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Zona: React.FC<{children: React.ReactNode; gap?: number; style?: React.CSSProperties}> = ({children, gap = 50, style}) => (
  <AbsoluteFill
    style={{
      top: ZONA.arriba,
      height: ZONA.abajo - ZONA.arriba,
      padding: '0 70px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap,
      ...style,
    }}
  >
    {children}
  </AbsoluteFill>
);

const Pop: React.FC<{retraso?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({retraso = 0, children, style}) => {
  const f = useCurrentFrame();
  const s = entrada(f, retraso, 30, {damping: 9, mass: 0.6});
  return <div style={{transform: `scale(${s})`, opacity: Math.min(1, s * 2), ...style}}>{children}</div>;
};

// ── gancho: mito tachado → verdad ───────────────────────────────────────────
export const Gancho: React.FC<EscenaProps> = ({v, palabras, inicio, dur}) => {
  const f = useCurrentFrame();
  const tTach = v.tachado ? momento(palabras, inicio, v.clave, Math.round(dur * 0.45)) : 0;
  const raya = interpolate(f, [8, 20], [0, 100], clamp);
  const sacudida = f < 14 ? Math.sin(f * 2.2) * (14 - f) * 0.8 : 0;
  return (
    <Zona gap={40}>
      <Pop>
        <div style={{transform: `rotate(${sacudida}deg)`}}>
          <Icono nombre={v.icono ?? 'bebe'} tam={460} />
        </div>
      </Pop>
      {v.tachado && (
        <div style={{position: 'relative', opacity: f >= tTach ? 0.35 : 1, transform: `scale(${f >= tTach ? 0.8 : 1})`}}>
          <TextoGrande texto={v.tachado} tam={v.tachado.length > 16 ? 68 : 84} />
          <div style={{position: 'absolute', left: 0, top: '52%', height: 14, width: `${raya}%`, background: C.rojo, borderRadius: 8, transform: 'rotate(-3deg)'}} />
        </div>
      )}
      {f >= tTach && (
        <div style={{width: '100%'}}>
          <TextoGrande texto={v.texto} destacado={v.destacado} tam={v.tam ?? 118} retraso={tTach} colorMarcador={v.color} />
        </div>
      )}
    </Zona>
  );
};

// ── texto: idea + icono ──────────────────────────────────────────────────────
export const Texto: React.FC<EscenaProps> = ({v}) => (
  <Zona>
    {v.icono && (
      <Pop>
        <Icono nombre={v.icono} tam={v.tamIcono ?? 400} color={v.colorIcono ? color(v.colorIcono) : undefined} />
      </Pop>
    )}
    <TextoGrande texto={v.texto} destacado={v.destacado} tam={v.tam ?? 84} retraso={6} colorMarcador={v.color} />
  </Zona>
);

// ── lista: elementos que aparecen al ser nombrados, con ✓ / ✗ ────────────────
export const Lista: React.FC<EscenaProps> = ({v, palabras, inicio, dur}) => {
  const items: any[] = v.items ?? [];
  const paso = Math.max(10, Math.floor((dur * 0.7) / Math.max(1, items.length)));
  return (
    <Zona gap={36} style={{alignItems: 'stretch'}}>
      {v.titulo && (
        <div style={{textAlign: 'center'}}>
          <TextoGrande texto={v.titulo} destacado={v.destacado} tam={76} />
        </div>
      )}
      {items.map((it, i) => {
        const t = momento(palabras, inicio, it.clave ?? it.texto, 8 + i * paso);
        return (
          <Pop key={i} retraso={t} style={{display: 'flex', alignItems: 'center', gap: 30, background: '#fff', border: `${TRAZO - 2}px solid ${C.tinta}`, borderRadius: 36, padding: '18px 30px', boxShadow: `0 10px 0 ${C.tinta}`}}>
            <Icono nombre={it.icono ?? 'molecula'} tam={130} />
            <div style={{flex: 1, fontFamily: FUENTE, fontWeight: 800, fontSize: 58, color: C.tinta, lineHeight: 1.1}}>{it.texto}</div>
            {it.estado && <Sello tipo={it.estado} retraso={t + 12} tam={110} />}
          </Pop>
        );
      })}
    </Zona>
  );
};

// ── estudio: tarjeta de publicación científica ──────────────────────────────
export const Estudio: React.FC<EscenaProps> = ({v}) => {
  const f = useCurrentFrame();
  const s = entrada(f, 0);
  const lupaX = interpolate(f, [15, 60], [-200, 200], clamp);
  return (
    <Zona gap={50}>
      <div style={{position: 'relative', transform: `translateY(${(1 - s) * 300}px) rotate(${(1 - s) * 8 - 2}deg)`, opacity: s}}>
        <div style={{width: 820, background: '#fff', border: `${TRAZO}px solid ${C.tinta}`, borderRadius: 28, boxShadow: `0 16px 0 ${C.tinta}`, overflow: 'hidden'}}>
          <div style={{background: C.tinta, color: '#fff', padding: '26px 40px', display: 'flex', justifyContent: 'space-between', fontFamily: 'Georgia, serif', fontSize: 64, fontWeight: 700}}>
            <span>{v.revista ?? 'Nature'}</span>
            <span style={{fontFamily: FUENTE, fontSize: 54}}>{v.anio ?? ''}</span>
          </div>
          <div style={{padding: '36px 40px', fontFamily: FUENTE, fontWeight: 800, fontSize: 54, color: C.tinta, lineHeight: 1.15}}>{v.titulo}</div>
          <div style={{padding: '0 40px 40px', display: 'flex', flexDirection: 'column', gap: 18}}>
            {[100, 92, 96, 70].map((w, i) => (
              <div key={i} style={{height: 18, width: `${w}%`, background: '#E4DCD0', borderRadius: 9}} />
            ))}
          </div>
        </div>
        <div style={{position: 'absolute', right: -40, top: -60, transform: `rotate(12deg)`}}>
          <Pildora texto={v.sello ?? '¡NUEVO ESTUDIO!'} fondo="amarillo" retraso={20} tam={44} />
        </div>
      </div>
      <div style={{transform: `translateX(${lupaX}px)`, opacity: aparecer(f, 15)}}>
        <Icono nombre={v.icono ?? 'lupa'} tam={260} />
      </div>
    </Zona>
  );
};

// ── viaje: algo viaja de A a B (hormona, señal, nutriente…) ──────────────────
const bez = (t: number, p0: number[], p1: number[], p2: number[], p3: number[]) => {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
};

export const Viaje: React.FC<EscenaProps> = ({v, dur}) => {
  const f = useCurrentFrame();
  const W = 940;
  const H = ZONA.abajo - ZONA.arriba;
  const A = [210, H - 190];
  const B = [W - 210, 190];
  const P1 = [W + 120, H - 250];
  const P2 = [-120, 250];
  const dibujo = interpolate(f, [5, 30], [1, 0], clamp);
  const viaje = Math.max(40, Math.round(dur * 0.45));
  const n = v.cantidad ?? Math.max(7, Math.floor((dur - viaje - 15) / 9));
  const col = color(v.particula?.color, C.amarillo);
  const llegadas = Array.from({length: n}).filter((_, i) => f - (15 + i * 9) > viaje).length;
  const camino = `M${A[0]} ${A[1]} C ${P1[0]} ${P1[1]}, ${P2[0]} ${P2[1]}, ${B[0]} ${B[1]}`;
  return (
    <AbsoluteFill style={{top: ZONA.arriba, height: H, left: 70, width: W}}>
      <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
        <path d={camino} fill="none" stroke={color(v.colorCamino, '#E7A4B4')} strokeWidth={70} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={dibujo} opacity={0.55} />
        <path d={camino} fill="none" stroke={C.tinta} strokeWidth={5} strokeLinecap="round" strokeDasharray="4 22" opacity={0.5 * (1 - dibujo)} />
        {Array.from({length: n}).map((_, i) => {
          const t = (f - (15 + i * 9)) / viaje;
          if (t < 0 || t > 1) return null;
          const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          const [x, y] = bez(e, A, P1, P2, B);
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${f * 6 + i * 40})`}>
              <circle r={30} fill={col} stroke={C.tinta} strokeWidth={6} />
              <circle r={9} cx={-8} cy={-8} fill="#fff" opacity={0.7} />
            </g>
          );
        })}
      </svg>
      <div style={{position: 'absolute', left: A[0] - 170, top: A[1] - 170, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Pop>
          <Icono nombre={v.desde?.icono ?? 'placenta'} tam={300} />
        </Pop>
        {v.desde?.etiqueta && <Pildora texto={v.desde.etiqueta} retraso={6} tam={44} style={{marginTop: -20}} />}
      </div>
      <div style={{position: 'absolute', left: B[0] - 170, top: B[1] - 170, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Pop retraso={10}>
          <div style={{transform: `scale(${1 + Math.min(llegadas, 6) * 0.03 + (llegadas ? Math.sin(f / 2) * 0.02 : 0)})`}}>
            <Icono nombre={v.hasta?.icono ?? 'cerebro'} tam={300} />
          </div>
        </Pop>
        {v.hasta?.etiqueta && <Pildora texto={v.hasta.etiqueta} retraso={16} tam={44} style={{marginTop: -20}} />}
      </div>
      {v.particula?.etiqueta && (
        <div style={{position: 'absolute', left: 0, right: 0, top: H / 2 - 50, display: 'flex', justifyContent: 'center'}}>
          <Pildora texto={v.particula.etiqueta} fondo={v.particula.color ?? 'amarillo'} retraso={22} tam={56} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── emision: una fuente fabrica muchas partículas ───────────────────────────
export const Emision: React.FC<EscenaProps> = ({v}) => {
  const f = useCurrentFrame();
  const H = ZONA.abajo - ZONA.arriba;
  const cx = 470;
  const cy = H / 2 + 60;
  const col = color(v.particula?.color, C.amarillo);
  const n = v.cantidad ?? 22;
  const cont = v.contador;
  return (
    <AbsoluteFill style={{top: ZONA.arriba, height: H, left: 70, width: 940}}>
      <svg width={940} height={H} style={{position: 'absolute', overflow: 'visible'}}>
        {Array.from({length: n}).map((_, i) => {
          const nace = 12 + i * 3;
          const t = f - nace;
          if (t < 0) return null;
          const a = (i * 137.5 * Math.PI) / 180;
          const d = Math.min(1, t / 35);
          const ease = 1 - Math.pow(1 - d, 3);
          const r = 190 + ease * (150 + (i % 5) * 40);
          const x = cx + Math.cos(a) * r + Math.sin((f + i * 10) / 15) * 8;
          const y = cy + Math.sin(a) * r * 0.85 + Math.cos((f + i * 7) / 13) * 8;
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${Math.min(1, t / 8)})`}>
              <circle r={22 + (i % 3) * 5} fill={col} stroke={C.tinta} strokeWidth={5} />
            </g>
          );
        })}
      </svg>
      <div style={{position: 'absolute', left: cx - 190, top: cy - 190}}>
        <Pop>
          <div style={{transform: `scale(${1 + Math.sin(f / 4) * 0.03})`}}>
            <Icono nombre={v.fuente?.icono ?? 'placenta'} tam={380} />
          </div>
        </Pop>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
        {v.fuente?.etiqueta && <Pildora texto={v.fuente.etiqueta} retraso={4} tam={50} />}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 10, display: 'flex', justifyContent: 'center'}}>
        {v.particula?.etiqueta && <Pildora texto={v.particula.etiqueta} fondo={v.particula.color ?? 'amarillo'} retraso={20} tam={56} />}
      </div>
      {cont && (
        <div style={{position: 'absolute', right: 0, top: 120, fontFamily: FUENTE, fontWeight: 900, fontSize: 110, color: C.tinta}}>
          ×{Math.round(interpolate(f, [15, 60], [cont.desde ?? 1, cont.hasta ?? 100], clamp))}
          {cont.sufijo ?? ''}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── receptor: llave (molécula) entra en cerradura (receptor) → efecto ────────
export const Receptor: React.FC<EscenaProps> = ({v, palabras, inicio, dur}) => {
  const f = useCurrentFrame();
  const H = ZONA.abajo - ZONA.arriba;
  const memY = 430;
  const tUnion = momento(palabras, inicio, v.clave, Math.round(dur * 0.35));
  const bajar = interpolate(f, [5, Math.max(10, tUnion)], [0, 1], clamp);
  const e = 1 - Math.pow(1 - bajar, 3);
  const molY = interpolate(e, [0, 1], [40, memY - 92]);
  const unido = f >= tUnion;
  const flash = unido ? interpolate(f - tUnion, [0, 12], [1, 0], clamp) : 0;
  const tEfecto = tUnion + 18;
  const colM = color(v.molecula?.color, C.amarillo);
  return (
    <AbsoluteFill style={{top: ZONA.arriba, height: H}}>
      <svg width={1080} height={H} style={{position: 'absolute'}}>
        {/* interior de la célula */}
        <rect x={-20} y={memY} width={1120} height={H - memY + 20} fill={color(v.colorCelula, '#D9F3EF')} />
        {/* membrana: doble fila de fosfolípidos */}
        {Array.from({length: 24}).map((_, i) => (
          <g key={i}>
            <circle cx={i * 47} cy={memY + 4} r={18} fill={C.coral} stroke={C.tinta} strokeWidth={4} />
            <circle cx={i * 47} cy={memY + 66} r={18} fill={C.coral} stroke={C.tinta} strokeWidth={4} />
          </g>
        ))}
        {/* receptor */}
        <g transform={`translate(540 ${memY})`}>
          <path d="M-70 -70 L -70 90 L 70 90 L 70 -70 L 40 -70 L 40 -10 L -40 -10 L -40 -70 Z" fill={unido ? C.verde : C.azul} stroke={C.tinta} strokeWidth={TRAZO} strokeLinejoin="round" />
          {flash > 0 && <circle r={160 + (1 - flash) * 120} fill="none" stroke={C.amarillo} strokeWidth={20 * flash} />}
        </g>
        {/* ondas de señal hacia dentro */}
        {unido &&
          [0, 1, 2].map((k) => {
            const t = ((f - tUnion + k * 12) % 36) / 36;
            return <path key={k} d={`M ${540 - 120 * t - 40} ${memY + 130 + t * 220} q ${120 * t + 40} 50 ${240 * t + 80} 0`} fill="none" stroke={C.morado} strokeWidth={10} strokeLinecap="round" opacity={1 - t} />;
          })}
        {/* molécula */}
        <g transform={`translate(540 ${molY}) rotate(${unido ? 0 : Math.sin(f / 5) * 20})`}>
          <rect x={-36} y={-50} width={72} height={100} rx={22} fill={colM} stroke={C.tinta} strokeWidth={TRAZO} />
          <circle cx={-10} cy={-22} r={9} fill="#fff" opacity={0.7} />
        </g>
      </svg>
      {v.molecula?.etiqueta && (
        <div style={{position: 'absolute', left: 620, top: Math.max(20, molY - 70), transition: 'none'}}>
          <Pildora texto={v.molecula.etiqueta} fondo={v.molecula.color ?? 'amarillo'} tam={46} retraso={4} />
        </div>
      )}
      {v.receptor?.etiqueta && (
        <div style={{position: 'absolute', left: 70, top: memY + 120}}>
          <Pildora texto={v.receptor.etiqueta} fondo="azul" tam={44} retraso={8} />
        </div>
      )}
      {v.celula?.etiqueta && <div style={{position: 'absolute', left: 60, bottom: 30, fontFamily: FUENTE, fontWeight: 800, fontSize: 44, color: C.tinta, opacity: 0.65}}>{v.celula.etiqueta}</div>}
      {f >= tEfecto && v.efecto && (
        <div style={{position: 'absolute', right: 60, bottom: 40, display: 'flex', alignItems: 'center', gap: 20}}>
          <Pop retraso={tEfecto}>
            <Icono nombre={v.efecto.icono ?? 'rayo'} tam={280} />
          </Pop>
          {v.efecto.texto && <Pildora texto={v.efecto.texto} fondo="amarillo" tam={62} retraso={tEfecto + 6} />}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── comparacion: dos columnas con barra de nivel ────────────────────────────
const Columna: React.FC<{d: any; retraso: number}> = ({d, retraso}) => {
  const f = useCurrentFrame();
  const llen = interpolate(f, [retraso + 10, retraso + 35], [0, d.valor ?? 0.5], clamp);
  const col = color(d.color, C.coral);
  return (
    <Pop retraso={retraso} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
      <div style={{fontFamily: FUENTE, fontWeight: 900, fontSize: 50, color: C.tinta, textAlign: 'center', minHeight: 130, display: 'flex', alignItems: 'center', lineHeight: 1.1}}>{d.titulo}</div>
      <Icono nombre={d.icono ?? 'mama'} tam={290} />
      <div style={{width: 120, height: 300, border: `${TRAZO}px solid ${C.tinta}`, borderRadius: 30, background: '#fff', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: `${llen * 100}%`, background: col}} />
      </div>
      {d.resultado && <Pildora texto={d.resultado} fondo={d.color ?? 'coral'} tam={44} retraso={retraso + 30} />}
    </Pop>
  );
};

export const Comparacion: React.FC<EscenaProps> = ({v, palabras, inicio, dur}) => {
  const tDer = momento(palabras, inicio, v.derecha?.clave, Math.round(dur * 0.45));
  const tIzq = momento(palabras, inicio, v.izquierda?.clave, 0);
  return (
    <Zona gap={30}>
      {v.titulo && <TextoGrande texto={v.titulo} destacado={v.destacado} tam={64} />}
      <div style={{display: 'flex', width: '100%', gap: 40, alignItems: 'flex-start'}}>
        <Columna d={v.izquierda ?? {}} retraso={Math.min(tIzq, tDer)} />
        <div style={{width: 6, alignSelf: 'stretch', background: C.tinta, opacity: 0.2, borderRadius: 3}} />
        <Columna d={v.derecha ?? {}} retraso={tDer} />
      </div>
    </Zona>
  );
};

// ── foco: un elemento grande con notas que aparecen alrededor ───────────────
export const Foco: React.FC<EscenaProps> = ({v, palabras, inicio, dur}) => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, dur], [1, 1.12], clamp);
  const notas: any[] = v.notas ?? [];
  const pos = [
    {left: 40, top: 60},
    {right: 40, top: 160},
    {left: 40, bottom: 160},
    {right: 40, bottom: 60},
  ];
  return (
    <AbsoluteFill style={{top: ZONA.arriba, height: ZONA.abajo - ZONA.arriba}}>
      <AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Pop>
          <div style={{transform: `scale(${zoom})`}}>
            <Icono nombre={v.icono ?? 'celula'} tam={v.tam ?? 560} />
          </div>
        </Pop>
      </AbsoluteFill>
      {v.etiqueta && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center'}}>
          <Pildora texto={v.etiqueta} fondo={v.color ?? 'amarillo'} tam={58} retraso={8} />
        </div>
      )}
      {notas.slice(0, 4).map((n, i) => (
        <div key={i} style={{position: 'absolute', ...pos[i]}}>
          <Pildora texto={n.texto} fondo={n.color ?? 'blanco'} tam={44} retraso={momento(palabras, inicio, n.clave ?? n.texto, 15 + i * 20)} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ── cifra: número grande que cuenta ─────────────────────────────────────────
export const Cifra: React.FC<EscenaProps> = ({v}) => {
  const f = useCurrentFrame();
  const n = interpolate(f, [5, 40], [v.desde ?? 0, v.numero ?? 100], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const dec = v.decimales ?? 0;
  return (
    <Zona gap={30}>
      {v.icono && (
        <Pop>
          <Icono nombre={v.icono} tam={300} />
        </Pop>
      )}
      <div style={{fontFamily: FUENTE, fontWeight: 900, fontSize: v.tamNumero ?? Math.min(230, Math.floor(1500 / Math.max(4, (String(v.numero ?? '') + (v.sufijo ?? '')).length))), whiteSpace: 'nowrap', color: color(v.color, C.coral), WebkitTextStroke: `10px ${C.tinta}`, paintOrder: 'stroke fill', lineHeight: 1}}>
        {n.toLocaleString('es-ES', {minimumFractionDigits: dec, maximumFractionDigits: dec})}
        {v.sufijo ?? ''}
      </div>
      {v.texto && <TextoGrande texto={v.texto} destacado={v.destacado} tam={70} retraso={10} />}
    </Zona>
  );
};

// ── cierre: conclusión + llamada a seguir ───────────────────────────────────
export const Cierre: React.FC<EscenaProps> = ({v}) => {
  const f = useCurrentFrame();
  return (
    <Zona gap={50}>
      {v.icono && (
        <Pop>
          <Icono nombre={v.icono} tam={340} />
        </Pop>
      )}
      <TextoGrande texto={v.texto} destacado={v.destacado} tam={v.tam ?? 84} colorMarcador={v.color} />
      {v.cta !== false && (
        <div style={{transform: `translateY(${Math.sin(f / 6) * 8}px)`}}>
          <Pildora texto={v.cta ?? 'Sígueme para más 🧠'} fondo="turquesa" tam={56} retraso={20} />
        </div>
      )}
    </Zona>
  );
};

// ── laboratorio: logo de un laboratorio + pruebas que ofrece (cierre promocional) ──
export const Laboratorio: React.FC<EscenaProps> = ({v, palabras, inicio}) => {
  const f = useCurrentFrame();
  const s = entrada(f, 0);
  const pruebas: string[] = v.pruebas ?? [];
  const tLista = momento(palabras, inicio, v.clave, 18);
  return (
    <Zona gap={44}>
      {v.logo && <Img src={staticFile(v.logo)} style={{width: v.anchoLogo ?? 760, opacity: s, transform: `scale(${0.85 + 0.15 * s})`}} />}
      {v.texto && <TextoGrande texto={v.texto} destacado={v.destacado} tam={v.tam ?? 64} retraso={8} colorMarcador={v.color} />}
      <div style={{display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'stretch', width: 860}}>
        {pruebas.map((p, i) => (
          <Pop key={i} retraso={tLista + i * 6} style={{display: 'flex', alignItems: 'center', gap: 20, background: '#fff', border: `${TRAZO - 3}px solid ${C.tinta}`, borderRadius: 26, padding: '12px 24px', boxShadow: `0 7px 0 ${C.tinta}`}}>
            <Sello tipo="si" tam={58} retraso={tLista + i * 6 + 4} />
            <span style={{fontFamily: FUENTE, fontWeight: 800, fontSize: 44, color: C.tinta}}>{p}</span>
          </Pop>
        ))}
      </div>
    </Zona>
  );
};

export const ESCENAS: Record<string, React.FC<EscenaProps>> = {
  laboratorio: Laboratorio,
  gancho: Gancho,
  texto: Texto,
  lista: Lista,
  estudio: Estudio,
  viaje: Viaje,
  emision: Emision,
  receptor: Receptor,
  comparacion: Comparacion,
  foco: Foco,
  cifra: Cifra,
  cierre: Cierre,
};
