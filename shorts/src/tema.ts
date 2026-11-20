export const ANCHO = 1080;
export const ALTO = 1920;
export const FPS = 30;

export const C = {
  fondo: '#FDF6EC',
  fondo2: '#F6E7D3',
  tinta: '#1E2A3A',
  coral: '#FF6B6B',
  turquesa: '#2EC4B6',
  amarillo: '#FFD166',
  morado: '#9B5DE5',
  azul: '#4D96FF',
  rosa: '#FF8FB1',
  verde: '#7BD389',
  rojo: '#E63946',
  blanco: '#FFFFFF',
};

// Nombre de color del guion -> hex (acepta también hex directamente)
export const color = (c?: string, def = C.coral) => {
  if (!c) return def;
  return (C as any)[c] ?? c;
};

export const FUENTE = 'Montserrat, "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji", sans-serif';
export const TRAZO = 8;

// Zona donde viven las animaciones (los subtítulos van debajo)
export const ZONA = {arriba: 170, abajo: 1130};
