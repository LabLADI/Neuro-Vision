import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Fondo} from './comunes';
import {ESCENAS} from './escenas';
import {Subtitulos} from './Subtitulos';
import {C, FUENTE, color} from './tema';
import type {Props} from './tipos';

const Transicion: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const ent = interpolate(f, [0, 7], [0, 1], {extrapolateRight: 'clamp'});
  const sal = interpolate(f, [dur - 6, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity: Math.min(ent, sal), transform: `translateY(${(1 - ent) * 30}px)`}}>{children}</AbsoluteFill>;
};

export const Short: React.FC<Props> = ({guion, audio, palabras, escenas, marca}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: C.fondo}}>
      {guion.escenas.map((e, i) => {
        const t = escenas[i];
        if (!t) return null;
        const desde = Math.round(t.inicio * fps);
        const hasta = i === guion.escenas.length - 1 ? durationInFrames : Math.round(t.fin * fps);
        const dur = Math.max(1, hasta - desde);
        const Comp = ESCENAS[e.visual.tipo] ?? ESCENAS.texto;
        const pal = palabras.filter((p) => p.inicio >= t.inicio - 0.01 && p.inicio < t.fin);
        return (
          <Sequence key={i} from={desde} durationInFrames={dur} name={`${i + 1}. ${e.visual.tipo}`}>
            <Fondo tono={e.fondo ? color(e.fondo) : undefined} />
            <Transicion dur={i === guion.escenas.length - 1 ? dur + 10 : dur}>
              <Comp v={e.visual} palabras={pal} inicio={t.inicio} dur={dur} />
            </Transicion>
          </Sequence>
        );
      })}
      {audio && <Audio src={staticFile(audio)} />}
      <Subtitulos palabras={palabras} />
      {/* barra de progreso */}
      <div style={{position: 'absolute', top: 0, left: 0, height: 14, width: `${(frame / durationInFrames) * 100}%`, background: C.coral}} />
      {marca && (
        <div style={{position: 'absolute', top: 60, width: '100%', textAlign: 'center', fontFamily: FUENTE, fontWeight: 800, fontSize: 38, color: C.tinta, opacity: 0.55}}>{marca}</div>
      )}
    </AbsoluteFill>
  );
};
