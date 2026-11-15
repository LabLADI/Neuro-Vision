# Detector de microscopía — App para el celular (PWA)

App web que se instala como aplicación y funciona **sin internet**. El modelo corre dentro del teléfono; las fotos no se envían a ningún lado. Funciona en Android y iPhone.

## 1. Agrega tus modelos (recomendado)
Copia a esta carpeta los archivos que generaste en Colab, con estos nombres:
- `modelo.onnx` → modelo de heces (el `best.onnx` del cuaderno de parásitos)
- `modelo_orina.onnx` → modelo de orina

La app los carga solos y deja elegir entre ellos. También puedes agregarlos desde el botón "Cargar modelo": quedan guardados en el teléfono y aparece una lista para cambiar de uno a otro.

## 2. Publícala en internet (gratis, necesita HTTPS)
**Opción A — GitHub Pages**
1. Crea una cuenta en github.com → *New repository* (público) → nombre p. ej. `detector-parasitos`.
2. *Add file → Upload files* → arrastra **todo el contenido** de esta carpeta (incluida `vendor/`) → *Commit*.
3. *Settings → Pages → Branch: main / (root) → Save*.
4. En 1–2 minutos tendrás tu enlace: `https://TU_USUARIO.github.io/detector-parasitos/`

**Opción B — Netlify**
1. Entra a app.netlify.com/drop (crea una cuenta gratis).
2. Arrastra esta carpeta completa. Te da un enlace al instante.

## 3. Instálala en el celular
- **Android (Chrome):** abre el enlace → menú ⋮ → *Instalar aplicación* / *Agregar a pantalla principal*.
- **iPhone (Safari):** abre el enlace → botón Compartir → *Agregar a inicio*.

## Uso
1. *Tomar foto* (apuntando el celular al ocular) o *Galería*.
2. En *Ajustes* elige el objetivo (40x, 10x…) para que calcule el tamaño en µm a partir del círculo del campo.
3. Ajusta la *Confianza mínima*: más alta = menos falsos positivos; más baja = detecta más pero con más errores.

## Usar otro modelo (orina, sangre…)
La app lee los nombres de las clases desde el propio modelo. Cualquier modelo YOLO (v8/11) exportado a ONNX funciona: solo cámbialo con el botón o reemplaza `modelo.onnx`.
Si cambias archivos de la app, sube el número de `VERSION` en `sw.js` (ahora `detector-v3`) para que los teléfonos descarguen la versión nueva.

## Probarla en tu computadora
```
python -m http.server 8000
```
y abre http://localhost:8000

## Archivos
`index.html`, `app.js` (interfaz y detección) · `sw.js` (modo sin conexión) · `manifest.webmanifest` + íconos (instalación) · `vendor/` (ONNX Runtime Web 1.31.1, licencia MIT).

> ⚠️ Prototipo educativo. No es un dispositivo médico ni sustituye el examen de laboratorio.
