import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FUENTE, TRAZO} from '../tema';

// Ilustraciones simples, de trazo grueso, estilo "dibujo didáctico".
// Todas usan viewBox 0 0 200 200. Si el nombre no existe, se dibuja como emoji.

type P = {color?: string; frame: number};
const T = C.tinta;
const sw = TRAZO;

const Ojitos = ({x, y, sep = 26, cerrados = false}: {x: number; y: number; sep?: number; cerrados?: boolean}) =>
  cerrados ? (
    <g stroke={T} strokeWidth={5} fill="none" strokeLinecap="round">
      <path d={`M${x - sep / 2 - 8} ${y} q8 7 16 0`} />
      <path d={`M${x + sep / 2 - 8} ${y} q8 7 16 0`} />
    </g>
  ) : (
    <g fill={T}>
      <circle cx={x - sep / 2} cy={y} r={6} />
      <circle cx={x + sep / 2} cy={y} r={6} />
    </g>
  );

const Bebe = ({frame}: P) => {
  const r = Math.sin(frame / 12) * 2;
  return (
    <g>
      <ellipse cx={100} cy={105} rx={82} ry={86} fill={C.rosa} stroke={T} strokeWidth={sw} />
      <ellipse cx={100} cy={105} rx={66} ry={70} fill="#FFD9E3" />
      <g transform={`rotate(${r} 100 105)`}>
        {/* cuerpo enroscado */}
        <path d="M70 110 C 60 160, 140 170, 140 125 C 140 100, 120 95, 105 100" fill="#FFC9A8" stroke={T} strokeWidth={sw} strokeLinejoin="round" />
        <circle cx={88} cy={82} r={32} fill="#FFC9A8" stroke={T} strokeWidth={sw} />
        <Ojitos x={86} y={84} sep={22} cerrados />
        <circle cx={70} cy={95} r={6} fill={C.rosa} opacity={0.7} />
        {/* cordón */}
        <path d="M118 140 C 140 160, 160 150, 168 120" fill="none" stroke={C.coral} strokeWidth={7} strokeLinecap="round" />
      </g>
    </g>
  );
};

const Mama = ({frame}: P) => {
  const b = Math.sin(frame / 15) * 2;
  return (
    <g transform={`translate(0 ${b})`}>
      <path d="M62 60 C 50 20, 150 20, 138 60 L 140 92 L 60 92 Z" fill="#5B3A29" stroke={T} strokeWidth={sw} strokeLinejoin="round" />
      <circle cx={100} cy={62} r={30} fill="#FFC9A8" stroke={T} strokeWidth={sw} />
      <Ojitos x={100} y={62} sep={22} />
      <path d="M92 74 q8 6 16 0" stroke={T} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M70 100 L 130 100 L 150 190 L 50 190 Z" fill={C.morado} stroke={T} strokeWidth={sw} strokeLinejoin="round" />
      <circle cx={122} cy={150} r={30} fill={C.morado} stroke={T} strokeWidth={sw} />
      <path d="M95 125 L 95 175" stroke={C.morado} strokeWidth={14} />
      <path d="M118 150 q4 -6 8 0 q4 6 -4 10 q-8 -4 -4 -10" fill={C.rosa} />
    </g>
  );
};

const Placenta = ({frame}: P) => {
  const p = 1 + Math.sin(frame / 8) * 0.02;
  return (
    <g transform={`translate(100 100) scale(${p}) translate(-100 -100)`}>
      <ellipse cx={100} cy={95} rx={80} ry={62} fill="#C8385A" stroke={T} strokeWidth={sw} />
      <g stroke="#7A1530" strokeWidth={5} fill="none" strokeLinecap="round">
        <path d="M100 95 C 80 80, 60 85, 40 75" />
        <path d="M100 95 C 120 70, 140 80, 160 70" />
        <path d="M100 95 C 90 120, 70 125, 50 115" />
        <path d="M100 95 C 120 120, 140 125, 158 112" />
        <path d="M100 95 C 100 70, 105 55, 100 40" />
      </g>
      <path d="M100 95 C 110 140, 80 160, 100 195" fill="none" stroke={C.azul} strokeWidth={12} strokeLinecap="round" />
      <path d="M100 95 C 110 140, 80 160, 100 195" fill="none" stroke={T} strokeWidth={3} strokeDasharray="6 10" />
    </g>
  );
};

const Cerebro = ({frame, color}: P) => {
  const p = 1 + Math.sin(frame / 10) * 0.015;
  return (
    <g transform={`translate(100 100) scale(${p}) translate(-100 -100)`}>
      <path
        d="M100 40 C 80 20, 45 30, 45 55 C 20 60, 15 95, 35 110 C 25 135, 50 160, 75 150 C 85 170, 115 170, 125 150 C 150 160, 175 135, 165 110 C 185 95, 180 60, 155 55 C 155 30, 120 20, 100 40 Z"
        fill={color ?? C.rosa}
        stroke={T}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <g stroke={T} strokeWidth={5} fill="none" strokeLinecap="round">
        <path d="M100 40 L 100 150" />
        <path d="M60 70 q15 10 30 0" />
        <path d="M110 70 q15 10 30 0" />
        <path d="M55 110 q15 -12 30 0" />
        <path d="M115 110 q15 -12 30 0" />
      </g>
      {/* tronco cerebral */}
      <path d="M95 155 L 92 190 L 108 190 L 105 155" fill="#E8A0B4" stroke={T} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
};

const Celula = ({frame, color}: P) => {
  const w = (i: number) => Math.sin(frame / 9 + i) * 4;
  const d = `M100 ${18 + w(0)} C ${150 + w(1)} 18, ${185 + w(2)} 55, 182 100 C ${180 + w(3)} 150, 145 ${182 + w(4)}, 100 182 C 50 ${182 + w(5)}, ${18 + w(6)} 150, 18 100 C 20 55, ${55 + w(7)} 18, 100 ${18 + w(0)} Z`;
  return (
    <g>
      <path d={d} fill={color ?? '#BDEFE9'} stroke={T} strokeWidth={sw} />
      <circle cx={95} cy={95} r={36} fill={C.morado} stroke={T} strokeWidth={sw} />
      <circle cx={88} cy={88} r={10} fill="#C9A7F5" />
      <ellipse cx={145} cy={70} rx={14} ry={8} fill={C.coral} stroke={T} strokeWidth={4} transform="rotate(30 145 70)" />
      <ellipse cx={60} cy={145} rx={14} ry={8} fill={C.coral} stroke={T} strokeWidth={4} transform="rotate(-20 60 145)" />
      <circle cx={140} cy={140} r={7} fill={C.amarillo} stroke={T} strokeWidth={3} />
      <circle cx={55} cy={60} r={6} fill={C.amarillo} stroke={T} strokeWidth={3} />
    </g>
  );
};

const Molecula = ({color}: P) => (
  <g>
    <g stroke={T} strokeWidth={sw}>
      <line x1={100} y1={100} x2={50} y2={60} />
      <line x1={100} y1={100} x2={155} y2={70} />
      <line x1={100} y1={100} x2={110} y2={160} />
    </g>
    <circle cx={100} cy={100} r={34} fill={color ?? C.amarillo} stroke={T} strokeWidth={sw} />
    <circle cx={50} cy={60} r={22} fill={C.turquesa} stroke={T} strokeWidth={sw} />
    <circle cx={155} cy={70} r={22} fill={C.coral} stroke={T} strokeWidth={sw} />
    <circle cx={110} cy={160} r={22} fill={C.azul} stroke={T} strokeWidth={sw} />
  </g>
);

const Nauseas = ({frame}: P) => {
  const r = frame * 8;
  const esp = (cx: number) => (
    <g transform={`rotate(${r} ${cx} 85)`}>
      <path d={`M${cx} 85 m-12 0 a12 12 0 1 1 12 12 a7 7 0 1 1 -7 -7`} fill="none" stroke={T} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
  const b = Math.sin(frame / 4) * 3;
  return (
    <g transform={`rotate(${b} 100 100)`}>
      <circle cx={100} cy={100} r={80} fill="#A8E6A1" stroke={T} strokeWidth={sw} />
      {esp(72)}
      {esp(128)}
      <path d="M65 140 q12 -12 24 0 q12 12 24 0 q12 -12 24 0" fill="none" stroke={T} strokeWidth={6} strokeLinecap="round" />
      <path d="M150 45 q6 -12 12 0 q-6 6 -12 0" fill={C.azul} />
    </g>
  );
};

const Estomago = ({color}: P) => (
  <g>
    <path d="M70 20 L 80 60 C 30 70, 30 160, 100 170 C 170 178, 185 110, 150 95 C 125 85, 115 110, 100 95 C 90 85, 100 70, 95 20 Z" fill={color ?? C.rosa} stroke={T} strokeWidth={sw} strokeLinejoin="round" />
    <path d="M100 170 L 110 195" stroke={T} strokeWidth={sw} strokeLinecap="round" />
  </g>
);

const Corazon = ({frame, color}: P) => {
  const p = 1 + Math.max(0, Math.sin(frame / 5)) * 0.08;
  return (
    <g transform={`translate(100 100) scale(${p}) translate(-100 -100)`}>
      <path d="M100 170 C 20 120, 10 60, 55 40 C 80 30, 95 45, 100 60 C 105 45, 120 30, 145 40 C 190 60, 180 120, 100 170 Z" fill={color ?? C.rojo} stroke={T} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M55 65 q10 -12 25 -8" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

const Adn = ({frame}: P) => {
  const els: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const y = 20 + i * 20;
    const ph = frame / 10 + i * 0.7;
    const x1 = 100 + Math.sin(ph) * 50;
    const x2 = 100 - Math.sin(ph) * 50;
    els.push(<line key={'l' + i} x1={x1} y1={y} x2={x2} y2={y} stroke={T} strokeWidth={5} />);
    els.push(<circle key={'a' + i} cx={x1} cy={y} r={11} fill={C.azul} stroke={T} strokeWidth={4} />);
    els.push(<circle key={'b' + i} cx={x2} cy={y} r={11} fill={C.coral} stroke={T} strokeWidth={4} />);
  }
  return <g>{els}</g>;
};

const Bacteria = ({frame, color}: P) => (
  <g transform={`rotate(${Math.sin(frame / 10) * 5} 100 100)`}>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <path key={i} d={`M${40 + i * 24} 140 q ${Math.sin(frame / 5 + i) * 8} 20 0 40`} stroke={T} strokeWidth={4} fill="none" />
    ))}
    <rect x={25} y={60} width={150} height={80} rx={40} fill={color ?? C.verde} stroke={T} strokeWidth={sw} />
    <Ojitos x={100} y={95} sep={30} />
  </g>
);

const Virus = ({frame, color}: P) => (
  <g transform={`rotate(${frame * 1.5} 100 100)`}>
    {Array.from({length: 10}).map((_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return (
        <g key={i}>
          <line x1={100 + Math.cos(a) * 55} y1={100 + Math.sin(a) * 55} x2={100 + Math.cos(a) * 85} y2={100 + Math.sin(a) * 85} stroke={T} strokeWidth={6} />
          <circle cx={100 + Math.cos(a) * 88} cy={100 + Math.sin(a) * 88} r={9} fill={C.coral} stroke={T} strokeWidth={4} />
        </g>
      );
    })}
    <circle cx={100} cy={100} r={58} fill={color ?? C.morado} stroke={T} strokeWidth={sw} />
  </g>
);

const Lupa = ({color}: P) => (
  <g>
    <line x1={130} y1={130} x2={180} y2={180} stroke={T} strokeWidth={22} strokeLinecap="round" />
    <circle cx={90} cy={90} r={60} fill={color ?? '#CDEBFF'} stroke={T} strokeWidth={sw} />
    <path d="M60 70 q15 -20 40 -18" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" />
  </g>
);

const Sangre = ({frame}: P) => (
  <g>
    <path d="M100 20 C 130 70, 160 100, 160 130 C 160 165, 130 185, 100 185 C 70 185, 40 165, 40 130 C 40 100, 70 70, 100 20 Z" fill={C.rojo} stroke={T} strokeWidth={sw} strokeLinejoin="round" />
    <ellipse cx={78} cy={130} rx={10} ry={18} fill="#fff" opacity={0.5 + Math.sin(frame / 8) * 0.2} />
  </g>
);

const Reloj = ({frame}: P) => (
  <g>
    <circle cx={100} cy={100} r={80} fill="#fff" stroke={T} strokeWidth={sw} />
    <line x1={100} y1={100} x2={100 + Math.cos(frame / 10) * 55} y2={100 + Math.sin(frame / 10) * 55} stroke={C.coral} strokeWidth={7} strokeLinecap="round" />
    <line x1={100} y1={100} x2={100} y2={55} stroke={T} strokeWidth={9} strokeLinecap="round" />
    <circle cx={100} cy={100} r={8} fill={T} />
  </g>
);

const Rayo = ({color}: P) => (
  <path d="M115 10 L 45 115 L 95 115 L 80 190 L 160 80 L 108 80 Z" fill={color ?? C.amarillo} stroke={T} strokeWidth={sw} strokeLinejoin="round" />
);

const Mensaje = ({color}: P) => (
  <g>
    <rect x={20} y={45} width={160} height={110} rx={14} fill={color ?? '#fff'} stroke={T} strokeWidth={sw} />
    <path d="M24 52 L 100 115 L 176 52" fill="none" stroke={T} strokeWidth={sw} strokeLinejoin="round" />
  </g>
);

const Pastilla = ({color}: P) => (
  <g transform="rotate(-35 100 100)">
    <rect x={30} y={70} width={140} height={60} rx={30} fill="#fff" stroke={T} strokeWidth={sw} />
    <path d="M100 74 L 140 74 A 26 26 0 0 1 140 126 L 100 126 Z" fill={color ?? C.coral} />
    <rect x={30} y={70} width={140} height={60} rx={30} fill="none" stroke={T} strokeWidth={sw} />
  </g>
);

const MAPA: Record<string, (p: P) => React.ReactElement> = {
  bebe: Bebe,
  feto: Bebe,
  mama: Mama,
  embarazada: Mama,
  mujer: Mama,
  placenta: Placenta,
  cerebro: Cerebro,
  celula: Celula,
  molecula: Molecula,
  hormona: Molecula,
  nauseas: Nauseas,
  mareo: Nauseas,
  estomago: Estomago,
  corazon: Corazon,
  adn: Adn,
  gen: Adn,
  genes: Adn,
  bacteria: Bacteria,
  virus: Virus,
  lupa: Lupa,
  estudio: Lupa,
  sangre: Sangre,
  reloj: Reloj,
  rayo: Rayo,
  energia: Rayo,
  mensaje: Mensaje,
  carta: Mensaje,
  pastilla: Pastilla,
  medicamento: Pastilla,
};

export const ICONOS_DISPONIBLES = Object.keys(MAPA);

export const Icono: React.FC<{nombre?: string; tam?: number; color?: string; style?: React.CSSProperties}> = ({nombre = 'celula', tam = 300, color, style}) => {
  const frame = useCurrentFrame();
  const Comp = MAPA[nombre.toLowerCase()];
  if (!Comp) {
    // Emoji / texto como respaldo
    return (
      <div style={{width: tam, height: tam, fontSize: tam * 0.78, lineHeight: `${tam}px`, textAlign: 'center', fontFamily: FUENTE, transform: `rotate(${Math.sin(frame / 12) * 4}deg)`, ...style}}>
        {nombre}
      </div>
    );
  }
  return (
    <svg width={tam} height={tam} viewBox="-10 -10 220 220" style={{overflow: 'visible', ...style}}>
      <Comp frame={frame} color={color} />
    </svg>
  );
};
