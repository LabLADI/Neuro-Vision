# NeuroVision

Detector de estructuras en muestras de laboratorio que corre en el celular, sin internet.
Usa un modelo YOLO11 (ONNX) y ONNX Runtime Web. Es una herramienta educativa y de apoyo: no sustituye la revisión de un profesional.

**Modelo de orina:** 7 clases (eritrocito, leucocito, célula epitelial, núcleo epitelial, cilindro, cristal, levadura). mAP50 0.912 sobre validación (Urinary Sediment Dataset + UMID).

**Modelo de heces:** 11 huevos de helmintos (Ascaris, Trichuris, Enterobius, Taenia, Hymenolepis nana y diminuta, Uncinaria, Fasciolopsis, Capillaria, Opisthorchis, Paragonimus). mAP50 0.992 sobre el conjunto de validación de Chula.

## Archivos
- `index.html`, `app.css`, `app.js`, `marks.js`, `sw.js`, `manifest.webmanifest`, `vendor/`: la app (PWA).
- `modelo.onnx` (heces) y `modelo_orina.onnx` (orina): la app los lista en un selector.
- `atlas.json`: fichas de referencia.
- `entrenamiento/`: cuadernos de Colab para reentrenar (heces y orina).

## Publicar
Con GitHub Pages: Settings → Pages → Deploy from a branch → `main` / root. La app queda en `https://labladi.github.io/Neuro-Vision/`.
Al cambiar archivos, sube `VERSION` en `sw.js` para que los teléfonos se actualicen.

## Instalar en el celular
Abre el enlace en Chrome (Android) o Safari (iPhone) → Compartir/menú → Agregar a pantalla de inicio. La primera vez necesita internet; después funciona sin conexión.

## Datos y créditos
Entrenado con Chula-ParasiteEgg-11 (Zenodo 15866298). Respeta las licencias de cada conjunto de datos.
