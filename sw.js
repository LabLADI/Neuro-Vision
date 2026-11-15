// Guarda la app para que funcione sin internet. Sube VERSION al publicar cambios.
const VERSION = 'detector-v3';
const ARCHIVOS = ['./', 'index.html', 'app.js', 'manifest.webmanifest', 'atlas.json', 'icon-192.png', 'icon-512.png',
  'vendor/ort.wasm.bundle.min.mjs', 'vendor/ort-wasm-simd-threaded.mjs', 'vendor/ort-wasm-simd-threaded.wasm'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // modelo.onnx: red primero (por si lo actualizas), copia guardada si no hay conexión
  if (url.pathname.endsWith('.onnx')) {
    e.respondWith(fetch(e.request).then((r) => {
      if (r.ok) { const copia = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copia)); }
      return r;
    }).catch(() => caches.match(e.request).then((r) => r || new Response('', { status: 404 }))));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
