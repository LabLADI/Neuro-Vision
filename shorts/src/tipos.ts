// Tipos compartidos entre el guion (JSON) y los componentes de Remotion.

export type Palabra = {texto: string; inicio: number; fin: number}; // segundos (absolutos)

export type Visual = {tipo: string; [k: string]: any};

export type Escena = {
  narracion: string;
  visual: Visual;
  fondo?: string; // color opcional de fondo para esta escena
};

export type Guion = {
  titulo: string;
  escenas: Escena[];
  portada?: {arriba?: string; destacado: string; abajo?: string; icono?: string};
  post?: {texto: string; hashtags?: string[]};
  voz?: {voice_id?: string; velocidad?: number};
};

export type EscenaTiempo = {inicio: number; fin: number}; // segundos

export type Props = {
  guion: Guion;
  audio: string | null; // ruta relativa dentro de public/
  palabras: Palabra[];
  escenas: EscenaTiempo[];
  duracion: number; // segundos
  marca?: string; // @usuario que aparece pequeño arriba
};
