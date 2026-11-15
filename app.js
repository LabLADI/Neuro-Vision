import * as ort from './vendor/ort.wasm.bundle.min.mjs';

ort.env.wasm.wasmPaths = new URL('./vendor/', import.meta.url).href;
ort.env.wasm.numThreads = 1;

// Nombres por defecto (Chula-ParasiteEgg-11) por si el modelo no trae los suyos
const NOMBRES_DEFECTO = ['Ascaris lumbricoides', 'Capillaria philippinensis', 'Enterobius vermicularis',
  'Fasciolopsis buski', 'Uncinaria (huevo)', 'Hymenolepis diminuta', 'Hymenolepis nana',
  'Opisthorchis viverrini', 'Paragonimus spp.', 'Taenia spp. (huevo)', 'Trichuris trichiura'];
const COLORES = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6',
  '#9a6324', '#469990', '#808000', '#000075', '#e6a800', '#800000', '#aaffc3'];
const IOU_NMS = 0.45;

const $ = (id) => document.getElementById(id);
let sesion = null, nombres = NOMBRES_DEFECTO, tamEntrada = 640, ultimaImagen = null, muestraModelo = 'heces';

// ---------- Ajustes recordados ----------
function leerAjuste(k, def) { try { return localStorage.getItem(k) ?? def; } catch { return def; } }
function guardarAjuste(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } }
$('objetivo').value = leerAjuste('objetivo', '450');
$('diamOtro').value = leerAjuste('diamOtro', '');
$('confianza').value = leerAjuste('confianza', '25');
$('confValor').textContent = $('confianza').value;
$('diamOtro').classList.toggle('oculto', $('objetivo').value !== 'otro');

$('objetivo').onchange = () => {
  guardarAjuste('objetivo', $('objetivo').value);
  $('diamOtro').classList.toggle('oculto', $('objetivo').value !== 'otro');
  if (ultimaImagen) analizar(ultimaImagen);
};
$('diamOtro').onchange = () => { guardarAjuste('diamOtro', $('diamOtro').value); if (ultimaImagen) analizar(ultimaImagen); };
$('confianza').oninput = () => { $('confValor').textContent = $('confianza').value; };
$('confianza').onchange = () => { guardarAjuste('confianza', $('confianza').value); if (ultimaImagen) analizar(ultimaImagen); };

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
const INCLUIDOS = [['modelo.onnx', 'Heces (incluido)'], ['modelo_orina.onnx', 'Orina (incluido)']];
let disponibles = []; // [{ id, etiqueta, origen: 'archivo' | 'bd' }]

async function refrescarLista(seleccion) {
  disponibles = [];
  for (const [archivo, etiqueta] of INCLUIDOS) {
    let hay = false;
    try { hay = (await fetch(archivo, { method: 'HEAD' })).ok; }
    catch { try { hay = !!(await caches.match(archivo)); } catch { /* sin caché */ } } // sin conexión
    if (hay) disponibles.push({ id: archivo, etiqueta, origen: 'archivo' });
  }
  for (const clave of await listarModelosBD()) {
    disponibles.push({ id: 'bd:' + clave, etiqueta: clave === 'actual' ? 'Modelo guardado' : clave, origen: 'bd', clave });
  }
  const sel = $('listaModelos'); sel.innerHTML = '';
  for (const m of disponibles) { const o = document.createElement('option'); o.value = m.id; o.textContent = m.etiqueta; sel.append(o); }
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
  return true;
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
  try {
    sesion = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] });
    nombres = leerNombresDeMetadatos(bytes) || NOMBRES_DEFECTO;
    const forma = sesion.inputMetadata?.[0]?.shape;
    if (forma && typeof forma[2] === 'number') tamEntrada = forma[2];
    if (guardar) await guardarModeloBD(bytes, nombreArchivo);
    estado(`✅ Modelo listo: ${nombreArchivo} · ${nombres.length} clases`, 'ok');
    $('btnCamara').disabled = false; $('btnGaleria').disabled = false;
    $('btnModelo').textContent = '📦 Agregar otro modelo';
    muestraModelo = nombres.some((n) => /eritrocito|leucocito|cilindro|cristal/i.test(n)) ? 'orina' : 'heces';
  } catch (e) {
    console.error(e);
    sesion = null;
    estado('❌ No se pudo abrir el modelo. ¿Es el archivo .onnx exportado en Colab?', 'err');
  }
}

async function iniciar() {
  await refrescarLista();
  const previo = leerAjuste('modeloActivo', '');
  if (previo && await activarModelo(previo)) return;
  if (disponibles.length && await activarModelo(disponibles[0].id)) return;
  estado('No hay modelo cargado. Toca "Cargar modelo" y elige tu archivo .onnx.');
}
$('listaModelos').onchange = async () => { await activarModelo($('listaModelos').value); if (ultimaImagen) analizar(ultimaImagen); };

$('btnModelo').onclick = () => $('archivoModelo').click();
$('archivoModelo').onchange = async (ev) => {
  const f = ev.target.files[0]; if (!f) return;
  await cargarModelo(new Uint8Array(await f.arrayBuffer()), f.name, true);
  ev.target.value = '';
  if (sesion) { await refrescarLista('bd:' + f.name); guardarAjuste('modeloActivo', 'bd:' + f.name); if (ultimaImagen) analizar(ultimaImagen); }
};

// ---------- Fotos ----------
$('btnCamara').onclick = () => $('archivoCamara').click();
$('btnGaleria').onclick = () => $('archivoGaleria').click();
for (const id of ['archivoCamara', 'archivoGaleria']) {
  $(id).onchange = async (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    ultimaImagen = await createImageBitmap(f, { imageOrientation: 'from-image' });
    ev.target.value = '';
    analizar(ultimaImagen);
  };
}

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

async function analizar(img) {
  if (!sesion) return;
  $('secResultado').classList.remove('oculto');
  $('resumen').innerHTML = '<span class="cargando" style="border-color:#0f3d3e;border-right-color:transparent"></span> Analizando…';
  $('escala').textContent = ''; $('tabla').classList.add('oculto');
  await new Promise((r) => setTimeout(r, 30));

  const conf = +$('confianza').value / 100;
  const pre = preprocesar(img);
  const t0 = performance.now();
  const out = await sesion.run({ [sesion.inputNames[0]]: pre.tensor });
  const cajas = posprocesar(out[sesion.outputNames[0]], conf, pre, img.width, img.height);
  const ms = Math.round(performance.now() - t0);

  // Escala
  const sel = $('objetivo').value;
  const diamUm = sel === 'otro' ? +$('diamOtro').value : +sel;
  let umPx = null;
  if (diamUm > 0) {
    const dpx = diametroCampoPx(img);
    if (dpx) { umPx = diamUm / dpx; $('escala').textContent = `Escala estimada: ${umPx.toFixed(3)} µm/píxel · análisis en ${ms} ms`; }
    else $('escala').textContent = `No se detectó el círculo del campo; tamaño no calculado · ${ms} ms`;
  } else $('escala').textContent = `Análisis en ${ms} ms`;

  // Dibujo
  const cv = $('lienzo'), ctx = cv.getContext('2d');
  cv.width = img.width; cv.height = img.height;
  ctx.drawImage(img, 0, 0);
  const grosor = Math.max(2, Math.round(Math.max(img.width, img.height) / 300));
  ctx.font = `600 ${grosor * 7}px system-ui, sans-serif`;
  cajas.forEach((c, i) => {
    const col = COLORES[c.cls % COLORES.length];
    ctx.strokeStyle = col; ctx.lineWidth = grosor;
    ctx.strokeRect(c.x1, c.y1, c.x2 - c.x1, c.y2 - c.y1);
    const etiqueta = `${i + 1}. ${nombres[c.cls] ?? 'clase ' + c.cls} ${Math.round(c.conf * 100)}%`;
    const tw = ctx.measureText(etiqueta).width + grosor * 3, th = grosor * 9;
    const ty = c.y1 - th < 0 ? c.y1 : c.y1 - th;
    ctx.fillStyle = col; ctx.fillRect(c.x1, ty, tw, th);
    ctx.fillStyle = '#fff'; ctx.fillText(etiqueta, c.x1 + grosor * 1.5, ty + th - grosor * 2);
  });

  // Calidad
  const avisoCalidad = revisarCalidad(img);
  $('calidad').textContent = avisoCalidad ? '⚠️ ' + avisoCalidad : '';
  $('calidad').classList.toggle('oculto', !avisoCalidad);
  window.__calidad = avisoCalidad;

  // Tabla
  $('fichaDet').innerHTML = '';
  const tbody = $('tabla').querySelector('tbody'); tbody.innerHTML = '';
  cajas.forEach((c, i) => {
    const tr = document.createElement('tr');
    const tam = umPx ? `${Math.round((c.x2 - c.x1) * umPx)} × ${Math.round((c.y2 - c.y1) * umPx)}` : '—';
    tr.innerHTML = `<td><span class="color" style="background:${COLORES[c.cls % COLORES.length]}"></span>${i + 1}. </td><td>${Math.round(c.conf * 100)}%</td><td>${tam}</td>`;
    tr.firstChild.append(nombres[c.cls] ?? `clase ${c.cls}`);
    tr.className = 'fila-det';
    tr.onclick = () => {
      const fichas = fichasPara(nombres[c.cls] ?? '');
      $('fichaDet').innerHTML = '';
      if (fichas.length > 1) {
        const p = document.createElement('p'); p.className = 'toque';
        p.textContent = `El modelo solo dice «${nombres[c.cls]}». Estos son los tipos posibles; compáralos al microscopio:`;
        $('fichaDet').append(p);
      }
      for (const e of fichas) $('fichaDet').append(crearFicha(e));
      if (!fichas.length) $('fichaDet').textContent = 'Esta estructura aún no tiene ficha en el atlas.';
    };
    tbody.append(tr);
  });
  $('tabla').classList.toggle('oculto', cajas.length === 0);
  $('toque').classList.toggle('oculto', cajas.length === 0);
  window.__ultimasCajas = cajas;
  const porClase = {};
  for (const c of cajas) { const n = nombres[c.cls] ?? `clase ${c.cls}`; porClase[n] = (porClase[n] || 0) + 1; }
  $('resumen').textContent = cajas.length
    ? `Se detectaron ${cajas.length} estructura(s): ` + Object.entries(porClase).map(([n, k]) => `${k} ${n}`).join(', ') + '.'
    : 'No se detectó ninguna estructura conocida con esta confianza.';
}

// ---------- Atlas de referencia ----------
let atlas = [], muestraAtlas = 'heces';
const sinAcentos = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Clases generales del modelo de orina -> qué fichas mostrar
const GRUPOS_ORINA = [
  [/cilindro/, (e) => e.group === 'cilindros'],
  [/cristal/, (e) => e.group === 'cristales'],
  [/epitel/, (e) => /epitel/.test(sinAcentos(e.name))],
  [/levadura|hongo/, (e) => /levadura|pseudohifa/.test(sinAcentos(e.name))],
  [/eritrocito/, (e) => /eritrocito/.test(sinAcentos(e.name))],
  [/leucocito/, (e) => /leucocito/.test(sinAcentos(e.name))],
];

function fichasPara(nombreClase) {
  const n = sinAcentos(nombreClase);
  const deMuestra = atlas.filter((e) => e.sample === muestraModelo || e.sample === 'ambas');
  if (muestraModelo === 'orina') {
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

function crearFicha(e) {
  const d = document.createElement('div'); d.className = 'ficha';
  const h = document.createElement('h3'); h.textContent = e.name;
  const lat = document.createElement('div'); lat.className = 'lat'; lat.textContent = e.latin;
  const visto = document.createElement('p'); visto.textContent = e.seen;
  const ul = document.createElement('ul');
  for (const b of e.bullets) { const li = document.createElement('li'); li.textContent = b; ul.append(li); }
  const par = (titulo, texto) => { const p = document.createElement('p'); const b = document.createElement('b');
    b.textContent = titulo + ' '; p.append(b, texto); return p; };
  d.append(h, lat, visto, ul, par('Se confunde con:', e.mimics), par('Significado:', e.significance));
  return d;
}

function pintarAtlas() {
  const q = sinAcentos($('buscarAtlas').value.trim());
  const lista = $('listaAtlas'); lista.innerHTML = '';
  const visibles = atlas.filter((e) => (e.sample === muestraAtlas || e.sample === 'ambas') &&
    (!q || sinAcentos([e.name, e.latin, ...e.aliases].join(' ')).includes(q)));
  for (const e of visibles) {
    const det = document.createElement('details'); det.className = 'entrada-atlas';
    const s = document.createElement('summary'); s.textContent = e.name;
    det.append(s);
    det.ontoggle = () => { if (det.open && det.children.length === 1) det.append(crearFicha(e)); };
    lista.append(det);
  }
  if (!visibles.length) lista.textContent = 'Sin resultados.';
}

for (const chip of document.querySelectorAll('.chip')) {
  chip.onclick = () => {
    muestraAtlas = chip.dataset.muestra;
    document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('activo', c === chip));
    pintarAtlas();
  };
}
$('buscarAtlas').oninput = pintarAtlas;
fetch('atlas.json').then((r) => r.json()).then((d) => { atlas = d; pintarAtlas(); })
  .catch(() => { $('listaAtlas').textContent = 'No se pudo cargar el atlas.'; });

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

// ---------- Modo sin conexión ----------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker no disponible', e));
}

iniciar();
