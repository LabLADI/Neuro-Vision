import * as ort from './vendor/ort.wasm.bundle.min.mjs';
import { marca } from './marks.js';

ort.env.wasm.wasmPaths = new URL('./vendor/', import.meta.url).href;
ort.env.wasm.numThreads = 1;

// Nombres por defecto (Chula-ParasiteEgg-11) por si el modelo no trae los suyos
const NOMBRES_DEFECTO = ['Ascaris lumbricoides', 'Capillaria philippinensis', 'Enterobius vermicularis',
  'Fasciolopsis buski', 'Uncinaria (huevo)', 'Hymenolepis diminuta', 'Hymenolepis nana',
  'Opisthorchis viverrini', 'Paragonimus spp.', 'Taenia spp. (huevo)', 'Trichuris trichiura'];
const COLORES = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6',
  '#9a6324', '#469990', '#808000', '#000075', '#e6a800', '#800000', '#aaffc3'];
const IOU_NMS = 0.45;

const OBJETIVOS = ['10×', '40×', '100×'];
const CAMPO_UM = { '10×': 1800, '40×': 450, '100×': 180 }; // diámetro típico del campo
const PREPS = { orina: ['Fresco', 'Sternheimer', 'No sé'], heces: ['Fresco salino', 'Lugol', 'Kato-Katz'] };
const GRUPOS = [['celulas', 'Células'], ['cilindros', 'Cilindros'], ['cristales', 'Cristales'],
  ['microorganismos', 'Microbios'], ['parasitos', 'Parásitos'], ['otros', 'Artefactos']];

const ICONOS = {
  camara: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  galeria: '<path d="M16 5h6M19 2v6"/><path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/><circle cx="9" cy="9" r="2"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  microscopio: '<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>',
};
const icono = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n]}</svg>`;

const $ = (id) => document.getElementById(id);
const sinAcentos = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// Crea elementos sin usar innerHTML con texto que viene de fuera
function h(tag, attrs = {}, ...hijos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of hijos.flat(Infinity)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}

let sesion = null, nombres = NOMBRES_DEFECTO, tamEntrada = 640, muestraModelo = 'orina';
let muestra = 'orina', objetivo = '40×', prep = PREPS.orina[0];
let imagen = null, problema = null, lecturaActual = null, atlas = [];
let muestraAtlas = 'orina', grupoAtlas = 'todas';

// ---------- Ajustes recordados ----------
function leerAjuste(k, def) { try { return localStorage.getItem(k) ?? def; } catch { return def; } }
function guardarAjuste(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } }
$('confianza').value = leerAjuste('confianza', '25');
$('confValor').textContent = $('confianza').value;
$('diamOtro').value = leerAjuste('diamOtro', '');
$('confianza').oninput = () => { $('confValor').textContent = $('confianza').value; };
$('confianza').onchange = () => guardarAjuste('confianza', $('confianza').value);
$('diamOtro').onchange = () => guardarAjuste('diamOtro', $('diamOtro').value);

// ---------- Almacenamiento del modelo (IndexedDB) ----------
function abrirBD() {
  return new Promise((ok, mal) => {
    const r = indexedDB.open('detector-parasitos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('modelos');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => mal(r.error);
  });
}
async function guardarModeloBD(bytes, nombre) {
  try {
    const bd = await abrirBD();
    await new Promise((ok, mal) => {
      const tx = bd.transaction('modelos', 'readwrite');
      tx.objectStore('modelos').put({ bytes, nombre }, nombre);
      tx.oncomplete = ok; tx.onerror = () => mal(tx.error);
    });
  } catch (e) { console.warn('No se pudo guardar el modelo', e); }
}
async function leerModeloBD(clave) {
  try {
    const bd = await abrirBD();
    return await new Promise((ok) => {
      const r = bd.transaction('modelos').objectStore('modelos').get(clave);
      r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null);
    });
  } catch { return null; }
}
async function listarModelosBD() {
  try {
    const bd = await abrirBD();
    return await new Promise((ok) => {
      const r = bd.transaction('modelos').objectStore('modelos').getAllKeys();
      r.onsuccess = () => ok(r.result || []); r.onerror = () => ok([]);
    });
  } catch { return []; }
}
// Modelos disponibles: los incluidos junto a la app y los guardados en el teléfono
const INCLUIDOS = [['modelo.onnx', 'Heces (incluido)', 'heces'], ['modelo_orina.onnx', 'Orina (incluido)', 'orina']];
let disponibles = []; // [{ id, etiqueta, origen: 'archivo' | 'bd', muestra? }]

async function refrescarLista(seleccion) {
  disponibles = [];
  for (const [archivo, etiqueta, m] of INCLUIDOS) {
    let hay = false;
    try { hay = (await fetch(archivo, { method: 'HEAD' })).ok; }
    catch { try { hay = !!(await caches.match(archivo)); } catch { /* sin caché */ } } // sin conexión
    if (hay) disponibles.push({ id: archivo, etiqueta, origen: 'archivo', muestra: m });
  }
  for (const clave of await listarModelosBD()) {
    disponibles.push({ id: 'bd:' + clave, etiqueta: clave === 'actual' ? 'Modelo guardado' : clave, origen: 'bd', clave });
  }
  const sel = $('listaModelos'); sel.innerHTML = '';
  for (const m of disponibles) sel.append(h('option', { value: m.id }, m.etiqueta));
  sel.classList.toggle('oculto', disponibles.length < 2);
  if (seleccion) sel.value = seleccion;
}

async function activarModelo(id) {
  const m = disponibles.find((x) => x.id === id); if (!m) return false;
  if (m.origen === 'archivo') {
    const r = await fetch(m.id); if (!r.ok) return false;
    await cargarModelo(new Uint8Array(await r.arrayBuffer()), m.etiqueta, false);
  } else {
    const g = await leerModeloBD(m.clave); if (!g) return false;
    await cargarModelo(g.bytes, g.nombre, false);
  }
  guardarAjuste('modeloActivo', id); $('listaModelos').value = id;
  return !!sesion;
}

// ---------- Carga del modelo ----------
function leerNombresDeMetadatos(bytes) {
  // Ultralytics guarda los nombres como texto: {0: 'Ascaris', 1: '...'}
  const texto = new TextDecoder('utf-8').decode(bytes);
  const m = texto.match(/\{0: ['"][\s\S]*?['"]\}/);
  if (!m) return null;
  const lista = [];
  for (const [, i, n] of m[0].matchAll(/(\d+): ['"]([^'"]*)['"]/g)) lista[+i] = n;
  return lista.length ? lista : null;
}

function estado(texto, tipo = '') {
  const e = $('estadoModelo'); e.textContent = texto; e.className = tipo;
}

async function cargarModelo(bytes, nombreArchivo, guardar) {
  estado('Cargando modelo…');
  actualizarBotonIdentificar();
  try {
    sesion = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] });
    nombres = leerNombresDeMetadatos(bytes) || NOMBRES_DEFECTO;
    const forma = sesion.inputMetadata?.[0]?.shape;
    if (forma && typeof forma[2] === 'number') tamEntrada = forma[2];
    if (guardar) await guardarModeloBD(bytes, nombreArchivo);
    muestraModelo = nombres.some((n) => /eritrocito|leucocito|cilindro|cristal/i.test(n)) ? 'orina' : 'heces';
    estado(`✅ Modelo listo: ${nombreArchivo} · ${nombres.length} clases (${muestraModelo})`, 'ok');
    $('btnModelo').textContent = 'Agregar otro modelo (.onnx)';
  } catch (e) {
    console.error(e);
    sesion = null;
    estado('❌ No se pudo abrir el modelo. ¿Es el archivo .onnx exportado en Colab?', 'err');
  }
  actualizarBotonIdentificar();
}

// Elige el modelo que corresponde a la muestra (heces u orina)
async function modeloParaMuestra(m) {
  if (sesion && muestraModelo === m) return;
  const incl = disponibles.find((d) => d.muestra === m);
  if (incl && await activarModelo(incl.id)) return;
  for (const d of disponibles.filter((x) => x.origen === 'bd')) {
    if (await activarModelo(d.id) && muestraModelo === m) return;
  }
}

async function iniciar() {
  await refrescarLista();
  const previo = leerAjuste('modeloActivo', '');
  if (previo && await activarModelo(previo)) { elegirMuestra(muestraModelo, false); return; }
  const primero = disponibles.find((d) => d.muestra === 'orina') || disponibles[0];
  if (primero && await activarModelo(primero.id)) { elegirMuestra(muestraModelo, false); return; }
  estado('No hay modelo cargado. Toca "Cargar otro modelo" y elige tu archivo .onnx.');
}
$('listaModelos').onchange = async () => { await activarModelo($('listaModelos').value); elegirMuestra(muestraModelo, false); };

$('btnModelo').onclick = () => $('archivoModelo').click();
$('archivoModelo').onchange = async (ev) => {
  const f = ev.target.files[0]; if (!f) return;
  await cargarModelo(new Uint8Array(await f.arrayBuffer()), f.name, true);
  ev.target.value = '';
  if (sesion) { await refrescarLista('bd:' + f.name); guardarAjuste('modeloActivo', 'bd:' + f.name); elegirMuestra(muestraModelo, false); }
};


// ---------- Inferencia ----------
function preprocesar(img) {
  const S = tamEntrada;
  const escala = Math.min(S / img.width, S / img.height);
  const w = Math.round(img.width * escala), h = Math.round(img.height * escala);
  const dx = Math.floor((S - w) / 2), dy = Math.floor((S - h) / 2);
  const c = new OffscreenCanvas(S, S), ctx = c.getContext('2d');
  ctx.fillStyle = 'rgb(114,114,114)'; ctx.fillRect(0, 0, S, S);
  ctx.drawImage(img, dx, dy, w, h);
  const px = ctx.getImageData(0, 0, S, S).data;
  const datos = new Float32Array(3 * S * S);
  for (let i = 0, n = S * S; i < n; i++) {
    datos[i] = px[i * 4] / 255; datos[n + i] = px[i * 4 + 1] / 255; datos[2 * n + i] = px[i * 4 + 2] / 255;
  }
  return { tensor: new ort.Tensor('float32', datos, [1, 3, S, S]), escala, dx, dy };
}

function iou(a, b) {
  const x1 = Math.max(a.x1, b.x1), y1 = Math.max(a.y1, b.y1), x2 = Math.min(a.x2, b.x2), y2 = Math.min(a.y2, b.y2);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  return inter / ((a.x2 - a.x1) * (a.y2 - a.y1) + (b.x2 - b.x1) * (b.y2 - b.y1) - inter + 1e-9);
}

function nms(cajas) {
  cajas.sort((a, b) => b.conf - a.conf);
  const res = [];
  for (const c of cajas) if (!res.some((r) => r.cls === c.cls && iou(r, c) > IOU_NMS)) res.push(c);
  return res;
}

function posprocesar(salida, conf, { escala, dx, dy }, W, H) {
  const [, d1, d2] = salida.dims, v = salida.data;
  const cajas = [];
  const agregar = (x1, y1, x2, y2, p, cls) => cajas.push({
    x1: Math.max(0, (x1 - dx) / escala), y1: Math.max(0, (y1 - dy) / escala),
    x2: Math.min(W, (x2 - dx) / escala), y2: Math.min(H, (y2 - dy) / escala), conf: p, cls });
  if (d2 === 6) { // modelos "end2end" (ya traen NMS): [1, N, 6] = x1,y1,x2,y2,score,clase
    for (let i = 0; i < d1; i++) {
      const o = i * 6; if (v[o + 4] >= conf) agregar(v[o], v[o + 1], v[o + 2], v[o + 3], v[o + 4], v[o + 5] | 0);
    }
    return cajas;
  }
  const nc = d1 - 4, N = d2; // formato YOLOv8/11: [1, 4+clases, N]
  for (let i = 0; i < N; i++) {
    let mejor = 0, cls = 0;
    for (let c = 0; c < nc; c++) { const p = v[(4 + c) * N + i]; if (p > mejor) { mejor = p; cls = c; } }
    if (mejor < conf) continue;
    const cx = v[i], cy = v[N + i], w = v[2 * N + i], h = v[3 * N + i];
    agregar(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, mejor, cls);
  }
  return nms(cajas);
}

function diametroCampoPx(img) {
  // Detecta el círculo iluminado de fotos tomadas a través del ocular
  const S = 300, k = S / Math.max(img.width, img.height);
  const w = Math.round(img.width * k), h = Math.round(img.height * k);
  const c = new OffscreenCanvas(w, h), ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const gris = new Float32Array(w * h); let min = 255, max = 0;
  for (let i = 0; i < w * h; i++) {
    const g = (px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2]) / 3; gris[i] = g;
    if (g < min) min = g; if (g > max) max = g;
  }
  const u = (min + max) / 2;
  let x0 = w, x1 = -1, y0 = h, y1 = -1, claros = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (gris[y * w + x] > u) {
    claros++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const frac = claros / (w * h);
  if (frac > 0.95 || frac < 0.05) return null;
  return Math.max(x1 - x0, y1 - y0) / k;
}
// ---------- Calidad de la foto ----------
function revisarCalidad(img) {
  const k = 256 / Math.max(img.width, img.height);
  const w = Math.max(4, Math.round(img.width * k)), h = Math.max(4, Math.round(img.height * k));
  const c = new OffscreenCanvas(w, h), ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  // Solo se evalúa la zona iluminada (el círculo del campo), no el borde negro del ocular
  const gris = new Float32Array(w * h); let max = 0;
  for (let i = 0; i < w * h; i++) { gris[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]; if (gris[i] > max) max = gris[i]; }
  if (max < 60) return 'El campo está muy oscuro. Sube la luz del microscopio y no uses el flash.';
  const u = max / 2; let n = 0, suma = 0, quemados = 0, lap = 0, lapN = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; if (gris[i] <= u) continue;
    n++; suma += gris[i]; if (gris[i] > 250) quemados++;
    if (gris[i - 1] > u && gris[i + 1] > u && gris[i - w] > u && gris[i + w] > u) {
      const v = gris[i - 1] + gris[i + 1] + gris[i - w] + gris[i + w] - 4 * gris[i]; lap += v * v; lapN++;
    }
  }
  if (n < 50) return null;
  if (quemados / n > 0.35) return 'El campo está quemado (demasiada luz). Quita el flash y cierra un poco el diafragma.';
  if (lapN > 50 && lap / lapN < 20) return 'La foto podría estar desenfocada o movida (o el campo está casi vacío). Si se ve borrosa, enfoca con el micrométrico y repite la toma.';
  return null;
}
// ---------- Atlas de referencia ----------
const fitsMuestra = (e, m) => e.sample === m || e.sample === 'ambas';

// Clases generales del modelo de orina -> qué fichas mostrar
const GRUPOS_ORINA = [
  [/cilindro/, (e) => e.group === 'cilindros'],
  [/cristal/, (e) => e.group === 'cristales'],
  [/epitel/, (e) => /epitel/.test(sinAcentos(e.name))],
  [/levadura|hongo/, (e) => /levadura|pseudohifa/.test(sinAcentos(e.name))],
  [/eritrocito/, (e) => /eritrocito/.test(sinAcentos(e.name))],
  [/leucocito/, (e) => /leucocito/.test(sinAcentos(e.name))],
];

function fichasPara(nombreClase, m = muestraModelo) {
  const n = sinAcentos(nombreClase);
  const deMuestra = atlas.filter((e) => fitsMuestra(e, m));
  if (m === 'orina') {
    for (const [patron, filtro] of GRUPOS_ORINA) if (patron.test(n)) { const r = deMuestra.filter(filtro); if (r.length) return r; }
  }
  let mejor = null, largo = 0;
  for (const e of deMuestra) {
    for (const clave of [e.name, e.latin, ...e.aliases]) {
      const k = sinAcentos(clave);
      if (k.length >= 4 && n.includes(k) && k.length > largo) { mejor = e; largo = k.length; }
    }
  }
  return mejor ? [mejor] : [];
}

function hojaDe(e, cerrar) {
  const g = GRUPOS.find(([id]) => id === e.group);
  return h('div', { class: 'col', style: 'gap:12px' },
    h('div', { class: 'cab2' },
      h('span', { class: 'ico', html: marca(e.mark) }),
      h('div', { style: 'min-width:0;flex:1' },
        h('p', { class: 'etq teal' }, g ? g[1] : ''),
        h('h2', {}, e.name),
        h('p', { class: 'muted' }, e.latin)),
      cerrar ? h('button', { type: 'button', class: 'x', 'aria-label': 'Cerrar', onclick: cerrar, html: icono('x') }) : null),
    h('p', { class: 'muted' }, e.seen),
    h('ul', {}, e.bullets.map((b) => h('li', { class: 'b' }, b))),
    h('p', {}, h('span', { class: 'muted' }, 'Confusores. '), e.mimics),
    h('p', {}, e.significance));
}

function abrirHoja(entradas) {
  const raiz = $('hojaRaiz'); raiz.innerHTML = '';
  const cerrar = () => { raiz.innerHTML = ''; };
  const cuerpo = h('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true' },
    entradas.map((e, i) => [i ? h('hr') : null, hojaDe(e, i === 0 ? cerrar : null)]));
  const fondo = h('div', { class: 'hoja-fondo', onclick: (ev) => { if (ev.target === fondo) cerrar(); } }, cuerpo);
  raiz.append(fondo);
}

function pintarAtlas() {
  const q = sinAcentos($('buscarAtlas').value.trim());
  const visiblesGrupos = GRUPOS.filter(([id]) => atlas.some((e) => fitsMuestra(e, muestraAtlas) && e.group === id));
  if (grupoAtlas !== 'todas' && !visiblesGrupos.some(([id]) => id === grupoAtlas)) grupoAtlas = 'todas';
  const chips = $('gruposAtlas'); chips.innerHTML = '';
  const chip = (id, texto) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(grupoAtlas === id),
    onclick: () => { grupoAtlas = id; pintarAtlas(); } }, texto);
  chips.append(chip('todas', 'Todas'), ...visiblesGrupos.map(([id, t]) => chip(id, t)));

  const lista = $('listaAtlas'); lista.innerHTML = '';
  const visibles = atlas.filter((e) => fitsMuestra(e, muestraAtlas) && (grupoAtlas === 'todas' || e.group === grupoAtlas) &&
    (!q || sinAcentos([e.name, e.latin, ...e.aliases].join(' ')).includes(q)));
  for (const e of visibles) {
    lista.append(h('li', {}, h('button', { type: 'button', class: 'item', onclick: () => abrirHoja([e]) },
      h('span', { class: 'ico', html: marca(e.mark) }),
      h('span', { class: 'txt' }, h('b', {}, e.name), h('span', { class: 's' }, e.latin)))));
  }
  if (!visibles.length) lista.append(h('li', { class: 'muted', style: 'font-size:.875rem' }, atlas.length ? 'Nada con ese nombre en el atlas.' : 'Cargando atlas…'));
  const heces = muestraAtlas === 'heces';
  $('subAtlas').textContent = heces ? 'Clave de huevos y protozoos fecales. No incluye cilindros ni cristales de orina.'
    : 'Clave del sedimento urinario. No incluye el coproparasitoscópico.';
  $('buscarAtlas').placeholder = heces ? 'Buscar: giardia, tricocéfalo, uncinaria…' : 'Buscar: tricomonas, cistina, cilindro…';
  $('notaAtlas').textContent = heces
    ? 'Taxonomía de copro: Chula-ParasiteEgg-11 para huevos y ParasitoBank para protozoos vistos con celular. El atlas no cubre todo el frotis.'
    : 'Taxonomía de uroanálisis: set de Liang (2018) y la práctica habitual. En orina el parásito propio es Trichomonas; el resto, si aparece, suele ser contaminación.';
}
function elegirMuestraAtlas(m) {
  muestraAtlas = m; grupoAtlas = 'todas';
  $('atlasOrina').setAttribute('aria-pressed', String(m === 'orina'));
  $('atlasHeces').setAttribute('aria-pressed', String(m === 'heces'));
  pintarAtlas();
}
$('atlasOrina').onclick = () => elegirMuestraAtlas('orina');
$('atlasHeces').onclick = () => elegirMuestraAtlas('heces');
$('buscarAtlas').oninput = pintarAtlas;
fetch('atlas.json').then((r) => r.json()).then((d) => { atlas = d; pintarAtlas(); })
  .catch(() => { $('listaAtlas').textContent = 'No se pudo cargar el atlas.'; });


// ---------- Pantalla: pestañas y pasos ----------
$('logo').innerHTML = icono('microscopio');
const DESC_MUESTRA = {
  orina: 'Sedimento: células, cilindros y cristales. Parásitos solo si son de orina.',
  heces: 'Copro: huevos y protozoos. No busca cilindros ni cristales.',
};
const TITULO_FOTO = { orina: 'Sedimento', heces: 'Huevos y protozoos' };

for (const b of document.querySelectorAll('nav button')) {
  b.onclick = () => {
    for (const x of document.querySelectorAll('nav button')) x.removeAttribute('aria-current');
    b.setAttribute('aria-current', 'page');
    for (const t of ['leer', 'atlas', 'bitacora']) $('tab-' + t).classList.toggle('oculto', t !== b.dataset.tab);
    if (b.dataset.tab === 'atlas') elegirMuestraAtlas(muestra);
    if (b.dataset.tab === 'bitacora') pintarBitacora();
    window.scrollTo(0, 0);
  };
}

function mostrarPaso(paso) {
  for (const [id, p] of [['stepMuestra', 'muestra'], ['stepFotos', 'fotos'], ['busy', 'busy'], ['stepResultado', 'resultado']]) {
    $(id).classList.toggle('oculto', p !== paso);
  }
  $('subLeer').textContent = paso === 'muestra' ? 'Primero la muestra. Después la foto.'
    : 'El resultado se limita a la muestra elegida: no mezcla cilindros con huevos.';
  $('subLeer').classList.toggle('oculto', paso === 'busy' || paso === 'resultado');
  window.scrollTo(0, 0);
}

function elegirMuestra(m, cargar = true) {
  if (m !== muestra) { objetivo = m === 'heces' ? '10×' : '40×'; prep = PREPS[m][0]; }
  muestra = m;
  $('chipOrina').setAttribute('aria-pressed', String(m === 'orina'));
  $('chipHeces').setAttribute('aria-pressed', String(m === 'heces'));
  $('descMuestra').textContent = DESC_MUESTRA[m];
  pintarFotos();
  if (cargar) modeloParaMuestra(m).then(() => { pintarFotos(); });
}
$('chipOrina').onclick = () => elegirMuestra('orina');
$('chipHeces').onclick = () => elegirMuestra('heces');
$('btnContinuar').onclick = () => { limpiarError(); mostrarPaso('fotos'); };
$('btnCambiarMuestra').onclick = () => mostrarPaso('muestra');

function actualizarBotonIdentificar() {
  const b = $('btnIdentificar'); if (!b) return;
  b.textContent = !sesion ? 'Cargando modelo…' : muestra === 'heces' ? 'Identificar en heces' : 'Identificar en orina';
  b.disabled = !sesion || !imagen;
}

function pintarFotos() {
  $('btnCambiarMuestra').textContent = `Muestra: ${muestra} · Cambiar`;
  $('btnCamara').innerHTML = icono('camara') + 'Tomar';
  $('btnGaleria').innerHTML = icono('galeria') + 'Galería';
  const grupo = (cont, lista, actual, fn) => {
    cont.innerHTML = '';
    for (const it of lista) cont.append(h('button', { type: 'button', class: 'chip', 'aria-pressed': String(it === actual), onclick: () => fn(it) }, it));
  };
  grupo($('chipsObjetivo'), OBJETIVOS, objetivo, (o) => { objetivo = o; pintarFotos(); });
  grupo($('chipsPrep'), PREPS[muestra], prep, (p) => { prep = p; pintarFotos(); });
  $('nota').placeholder = muestra === 'heces'
    ? 'Consistencia, moco, sangre visible. No escribas el nombre del paciente.'
    : 'pH, aspecto, chorro medio. No escribas el nombre del paciente.';
  const vista = $('vista'); vista.innerHTML = '';
  if (imagen && imagen._url) vista.append(h('img', { src: imagen._url, alt: `Campo a ${objetivo}` }));
  else vista.append(h('div', { class: 'vacio' },
    h('span', { class: 'circ', html: icono('camara') }),
    h('p', { class: 'tt' }, `${TITULO_FOTO[muestra]} · ${objetivo}`),
    h('p', { class: 'muted', style: 'font-size:.875rem' }, objetivo === '100×' ? '100× con aceite. Sin flash.' : 'Enfoca, baja un poco el condensador y evita el flash.')));
  $('btnQuitar').classList.toggle('oculto', !imagen);
  $('problema').classList.toggle('oculto', !problema);
  $('problema').textContent = problema ? '⚠️ ' + problema : '';
  actualizarBotonIdentificar();
}

function limpiarError() { $('errorLeer').classList.add('oculto'); $('errorLeer').textContent = ''; }
function mostrarError(t) { $('errorLeer').textContent = t; $('errorLeer').classList.remove('oculto'); }

// ---------- Fotos ----------
$('btnCamara').onclick = () => $('archivoCamara').click();
$('btnGaleria').onclick = () => $('archivoGaleria').click();
for (const id of ['archivoCamara', 'archivoGaleria']) {
  $(id).onchange = async (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    limpiarError();
    try {
      if (imagen?._url) URL.revokeObjectURL(imagen._url);
      imagen = await createImageBitmap(f, { imageOrientation: 'from-image' });
      imagen._url = URL.createObjectURL(f);
      problema = revisarCalidad(imagen);
      window.__calidad = problema;
    } catch { imagen = null; problema = null; mostrarError('No pude abrir esa imagen. Prueba con otra foto.'); }
    ev.target.value = '';
    pintarFotos();
  };
}
$('btnQuitar').onclick = () => { if (imagen?._url) URL.revokeObjectURL(imagen._url); imagen = null; problema = null; pintarFotos(); };
$('btnNueva').onclick = () => {
  if (imagen?._url) URL.revokeObjectURL(imagen._url);
  imagen = null; problema = null; lecturaActual = null; $('nota').value = '';
  pintarFotos(); mostrarPaso('muestra');
};

// ---------- Análisis ----------
const aDataURL = (cv, ancho, calidad) => {
  const k = Math.min(1, ancho / cv.width);
  const c = document.createElement('canvas'); c.width = Math.round(cv.width * k); c.height = Math.round(cv.height * k);
  c.getContext('2d').drawImage(cv, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', calidad);
};

async function identificar() {
  if (!imagen) return;
  limpiarError();
  await modeloParaMuestra(muestra);
  if (!sesion || muestraModelo !== muestra) {
    mostrarError(`No hay un modelo de ${muestra} cargado. Agrégalo en «Modelos y ajustes».`);
    return;
  }
  mostrarPaso('busy');
  await new Promise((r) => setTimeout(r, 40));
  try {
    const img = imagen;
    const conf = +$('confianza').value / 100;
    const pre = preprocesar(img);
    const t0 = performance.now();
    const out = await sesion.run({ [sesion.inputNames[0]]: pre.tensor });
    const cajas = posprocesar(out[sesion.outputNames[0]], conf, pre, img.width, img.height);
    const ms = Math.round(performance.now() - t0);

    // Escala a partir del círculo iluminado del ocular
    const personal = +$('diamOtro').value;
    const diamUm = personal > 0 ? personal : CAMPO_UM[objetivo];
    let umPx = null, escalaTxt;
    const dpx = diametroCampoPx(img);
    if (dpx) { umPx = diamUm / dpx; escalaTxt = `Escala estimada: ${umPx.toFixed(3)} µm/píxel (campo de ${diamUm} µm) · ${ms} ms`; }
    else escalaTxt = `No se detectó el círculo del campo; tamaño no calculado · ${ms} ms`;

    // Dibujo de las cajas
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
    const grosor = Math.max(2, Math.round(Math.max(img.width, img.height) / 300));
    ctx.font = `600 ${grosor * 7}px system-ui, sans-serif`;
    cajas.forEach((c, i) => {
      const col = COLORES[c.cls % COLORES.length];
      ctx.strokeStyle = col; ctx.lineWidth = grosor;
      ctx.strokeRect(c.x1, c.y1, c.x2 - c.x1, c.y2 - c.y1);
      const et = `${i + 1}. ${nombres[c.cls] ?? 'clase ' + c.cls} ${Math.round(c.conf * 100)}%`;
      const tw = ctx.measureText(et).width + grosor * 3, th = grosor * 9;
      const ty = c.y1 - th < 0 ? c.y1 : c.y1 - th;
      ctx.fillStyle = col; ctx.fillRect(c.x1, ty, tw, th);
      ctx.fillStyle = '#fff'; ctx.fillText(et, c.x1 + grosor * 1.5, ty + th - grosor * 2);
    });

    // Hallazgos agrupados por clase
    const grupos = new Map();
    for (const c of cajas) {
      const g = grupos.get(c.cls) || { cls: c.cls, nombre: nombres[c.cls] ?? `clase ${c.cls}`, n: 0, conf: 0, tams: [] };
      g.n++; g.conf = Math.max(g.conf, c.conf);
      if (umPx) g.tams.push(`${Math.round((c.x2 - c.x1) * umPx)} × ${Math.round((c.y2 - c.y1) * umPx)}`);
      grupos.set(c.cls, g);
    }
    const hallazgos = [...grupos.values()].sort((a, b) => b.conf - a.conf)
      .map((g) => ({ nombre: g.nombre, n: g.n, conf: Math.round(g.conf * 100), tams: g.tams.slice(0, 5), cls: g.cls }));

    const resumen = cajas.length
      ? `Se detectaron ${cajas.length} estructura(s): ` + hallazgos.map((g) => `${g.n} ${g.nombre}`).join(', ') + '.'
      : 'No se detectó ninguna estructura conocida con esta confianza.';
    const lectura = {
      id: Date.now().toString(36), creada: new Date().toISOString(), sample: muestra, objetivo, prep,
      nota: $('nota').value.trim(), calidad: problema, escalaTxt, resumen, hallazgos,
      foto: aDataURL(cv, 1280, 0.8), thumb: aDataURL(cv, 640, 0.6),
    };
    window.__ultimasCajas = cajas; window.__calidad = problema;
    lecturaActual = lectura;
    guardarEnBitacora(lectura);
    mostrarResultado(lectura);
  } catch (e) {
    console.error(e);
    mostrarPaso('fotos');
    mostrarError('No se pudo completar la lectura. Prueba con otra foto.');
  }
}
$('btnIdentificar').onclick = identificar;

// ---------- Resultado ----------
function formatoReporte(l) {
  return [
    'NEUROVISION — impresión visual, no es un resultado oficial',
    new Date(l.creada).toLocaleString('es-MX'),
    `Muestra ${l.sample} · objetivo ${l.objetivo} · ${l.prep}`,
    l.escalaTxt, l.nota ? `Nota: ${l.nota}` : '', l.resumen,
    ...l.hallazgos.map((g) => `- ${g.nombre}: ${g.n} detectado(s), confianza máx. ${g.conf}%${g.tams.length ? ` (${g.tams.join(', ')} µm)` : ''}`),
    'Confirmar al microscopio. No evalúa motilidad ni birrefringencia.',
  ].filter(Boolean).join('\n');
}

function mostrarResultado(l) {
  const tarjeta = $('tarjetaRes'); tarjeta.innerHTML = '';
  const copiar = h('button', { type: 'button', class: 'copiar' }, 'Copiar');
  copiar.onclick = async () => {
    try { await navigator.clipboard.writeText(formatoReporte(l)); copiar.textContent = 'Copiado'; }
    catch { mostrarError('No pude copiar. Selecciona el texto a mano.'); }
  };
  tarjeta.append(...[
    h('div', { class: 'res-cab' },
      h('div', {}, h('p', { class: 'etq' }, l.calidad ? 'Campo difícil' : 'Campo utilizable'), h('h2', {}, 'Impresión del campo')),
      copiar),
    h('img', { class: 'foto-res', src: l.foto || l.thumb, alt: `Campo leído a ${l.objetivo}` }),
    l.calidad ? h('p', { class: 'aviso' }, '⚠️ ' + l.calidad) : null,
    h('p', { class: 'muted', style: 'font-size:.875rem;line-height:1.55' }, l.escalaTxt),
    h('p', { style: 'font-size:.875rem;line-height:1.55' }, l.resumen)].filter(Boolean));

  const lista = h('ul', { class: 'hallazgos' });
  for (const g of l.hallazgos) {
    const fichas = fichasPara(g.nombre, l.sample);
    const una = fichas.length === 1 ? fichas[0] : null;
    const color = COLORES[g.cls % COLORES.length];
    lista.append(h('li', { class: 'raised' },
      h('div', { class: 'hall' },
        h('div', { class: 'fila' },
          fichas.length ? h('span', { class: 'ico', html: marca(fichas[0].mark) }) : null,
          h('div', { style: 'min-width:0;flex:1' },
            h('div', { class: 'nom' }, h('span', {}, h('span', { class: 'punto', style: `background:${color}` }), g.nombre), h('span', { class: 'pct' }, g.conf + '%')),
            h('small', {}, `${g.n} detectado${g.n > 1 ? 's' : ''}${g.tams.length ? ' · ' + g.tams.join(', ') + ' µm' : ''}`))),
        h('div', { class: 'barra' }, h('i', { style: `width:${g.conf}%` })),
        una ? h('p', { style: 'margin-top:6px' }, una.bullets[0]) : null,
        !una && fichas.length ? h('p', { style: 'margin-top:6px' }, 'Tipos posibles: ' + fichas.slice(0, 5).map((f) => f.name).join(', ') + (fichas.length > 5 ? '…' : '') + '.') : null,
        una ? h('p', { class: 'muted' }, 'Se confunde con: ' + una.mimics) : null,
        fichas.length ? h('button', { type: 'button', class: 'enlace', onclick: () => abrirHoja(fichas) }, una ? 'Ver la clave completa' : 'Ver los tipos posibles') : null)));
  }
  if (l.hallazgos.length) tarjeta.append(lista);
  tarjeta.append(h('p', { class: 'pie-aviso sep' },
    'No es diagnóstico ni reporte de laboratorio. Reconoce solo las estructuras con las que se entrenó el modelo y puede confundir artefactos (restos vegetales, burbujas, fibras). Una foto no evalúa motilidad, birrefringencia ni conteo por campo. La escala en µm es aproximada. Confirma en el microscopio.'));
  lecturaActual = l;
  mostrarPaso('resultado');
}

// ---------- Bitácora (solo en este teléfono) ----------
const cargarBitacora = () => { try { return JSON.parse(localStorage.getItem('bitacora') || '[]'); } catch { return []; } };
function guardarEnBitacora(l) {
  const { foto, ...guardable } = l; // la foto grande no se guarda
  let lista = [guardable, ...cargarBitacora()].slice(0, 12);
  while (lista.length) {
    try { localStorage.setItem('bitacora', JSON.stringify(lista)); return; } catch { lista = lista.slice(0, -1); }
  }
}
function pintarBitacora() {
  const lista = cargarBitacora(), ul = $('listaBit'); ul.innerHTML = '';
  $('bitVacia').classList.toggle('oculto', lista.length > 0);
  for (const l of lista) {
    ul.append(h('li', { class: 'bit' },
      h('button', { type: 'button', class: 'abrir', onclick: () => abrirGuardada(l) },
        l.thumb ? h('img', { src: l.thumb, alt: '' }) : h('span', { class: 'sin' }, 'Sin foto'),
        h('span', { style: 'min-width:0' },
          h('b', {}, l.hallazgos[0]?.nombre ?? 'Sin estructuras claras'),
          h('small', {}, `${l.sample === 'heces' ? 'Heces' : 'Orina'} · ${l.objetivo} · ${new Date(l.creada).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`))),
      h('button', { type: 'button', class: 'quitar', 'aria-label': 'Quitar de la bitácora', html: icono('x'),
        onclick: () => { try { localStorage.setItem('bitacora', JSON.stringify(cargarBitacora().filter((x) => x.id !== l.id))); } catch { /* */ } pintarBitacora(); } })));
  }
}
function abrirGuardada(l) {
  for (const x of document.querySelectorAll('nav button')) x.removeAttribute('aria-current');
  document.querySelector('nav button[data-tab="leer"]').setAttribute('aria-current', 'page');
  for (const t of ['leer', 'atlas', 'bitacora']) $('tab-' + t).classList.toggle('oculto', t !== 'leer');
  mostrarResultado(l);
}

// ---------- Modo sin conexión ----------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker no disponible', e));
}

elegirMuestra('orina', false);
mostrarPaso('muestra');
iniciar();
