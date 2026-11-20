import React from 'react';
import {Composition, Still} from 'remotion';
import {Portada} from './Portada';
import {Short} from './Short';
import {ALTO, ANCHO, FPS} from './tema';
import type {Props} from './tipos';
import ejemplo from '../videos/nauseas-embarazo/props.json';

const porDefecto = ejemplo as unknown as Props;

export const Root: React.FC = () => (
  <>
    <Composition
      id="Short"
      component={Short}
      width={ANCHO}
      height={ALTO}
      fps={FPS}
      durationInFrames={300}
      defaultProps={porDefecto}
      calculateMetadata={({props}) => ({durationInFrames: Math.max(30, Math.ceil(props.duracion * FPS))})}
    />
    <Still id="Portada" component={Portada} width={ANCHO} height={ALTO} defaultProps={porDefecto} />
  </>
);
