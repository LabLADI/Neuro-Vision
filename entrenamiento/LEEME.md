# Detector de parásitos — versión unida

## Qué contiene
| Carpeta / archivo | Qué es |
|---|---|
| `entrenar_en_colab.ipynb` | Cuaderno para entrenar el modelo en Google Colab. Junta Chula-ParasiteEgg-11 (huevos), el set de microscopio USB, ParasitoBank (protozoos, opcional) y tus propias fotos etiquetadas (opcional). |
| `entrenar_orina_en_colab.ipynb` | Cuaderno para entrenar el modelo de sedimento urinario (7 clases). |
| `app_celular/` | App para el celular (PWA). Detecta sin internet con tu modelo, calcula tamaños, avisa si la foto salió mal y trae un atlas de referencia de heces y orina. |

## Paso a paso

### A. Antes de entrenar (opcional, recomendado)
1. Entra a https://data.mendeley.com/datasets/725hpzpwzf/1 y pulsa *Download All*.
2. Sube ese zip a tu Google Drive, dentro de una carpeta llamada `detector_parasitos`, con el nombre `ParasitoBank.zip`.
   Sin este paso el modelo solo aprende huevos de helmintos, no protozoos.

### B. Entrenar (en la PC)
1. Abre https://colab.research.google.com → *Archivo → Subir cuaderno* → `entrenar_en_colab.ipynb`.
2. *Entorno de ejecución → Cambiar tipo de entorno de ejecución → T4 GPU → Guardar*.
3. Ejecuta las celdas en orden con ▶, esperando a que termine cada una:
   - Paso 1: debe aparecer "Tesla T4".
   - Paso 2: acepta el permiso de Google Drive.
   - Paso 3: dos celdas, tardan segundos.
   - Paso 4: descarga 9 GB (15–25 min). Debe decir "no encontradas: 0".
   - Paso 4b: suma las otras bases. Si alguna falla, avisa con ⚠️ y sigue; no detiene nada. Al final lista cuántas marcas hay por clase.
   - Paso 5: entrena (2–4 horas). No cierres la pestaña ni dejes que la PC se suspenda.
   - Paso 6: precisión total y por clase. Las clases marcadas "no reportar" no son confiables todavía.
   - Paso 9: genera `best.onnx`.
4. Si Colab se desconecta durante el paso 5: activa la T4 otra vez, repite los pasos 1 a 4b y ejecuta el **5b** (no el 5).

### C. Poner el modelo en la app
1. Descarga de Drive `detector_parasitos/entrenamiento/weights/best.onnx`.
2. Cópialo dentro de `app_celular/` con el nombre `modelo.onnx`.
3. Publica la carpeta `app_celular/` (GitHub Pages o Netlify; instrucciones en `app_celular/LEEME.md`) e instálala en el celular.
   Para solo probar: abre la app y usa el botón "Cargar modelo".

## Modelo de orina
1. Sube `entrenar_orina_en_colab.ipynb` a Colab, activa la T4 GPU y ejecuta las celdas en orden.
2. El paso 3 intenta bajar la base principal sola. Si falla, descárgala a mano de
   https://drive.google.com/drive/folders/18VqmoqK7dVSdxiyEE6qCfIpS8UOqqIBS , súbela a tu Drive en la carpeta `detector_orina` y repite la celda.
3. En el paso 4 revisa las marcas por clase: Cilindro, Cristal y Levadura no deben salir en 0.
4. Entrenar tarda 1–2 horas. El paso 8 deja `detector_orina/modelo_orina.onnx` en tu Drive.
5. Cárgalo en la app con "Cargar modelo" (o cópialo a `app_celular/`). La app permite cambiar entre el modelo de heces y el de orina.

Para tus propias fotos de orina: `detector_orina/mis_anotaciones/` con `images/`, `labels/` y `classes.txt`. Ahí puedes crear clases más finas (p. ej. `Oxalato de calcio`, `Cilindro hialino`).

## Para mejorar el modelo con tus fotos
En Drive, crea `detector_parasitos/mis_anotaciones/` con `images/`, `labels/` (formato YOLO) y `classes.txt` (un nombre por línea). Incluye una clase `artefacto` con restos vegetales, burbujas y polen: es lo que más reduce los falsos positivos. El paso 4b las suma solo.

## Límites
- Los protozoos son muy pequeños en las fotos y hay pocas imágenes: espera menor precisión que en huevos.
- El modelo de orina solo dice «Cilindro» o «Cristal», sin el tipo; la app muestra las fichas de los tipos posibles para compararlos. No detecta bacterias, espermatozoides ni Trichomonas.
- Herramienta educativa. No es un dispositivo médico ni sustituye el examen de laboratorio.

## Créditos de datos
Chula-ParasiteEgg-11 (ICIP 2022, zenodo.org/records/15866298) · Chula USB (zenodo.org/records/10437395) · ParasitoBank (Universidad del Cauca, DOI 10.17632/725hpzpwzf.1) · Urinary Sediment Dataset (Liang et al., 2018) · UMID (Goswami et al., 2021). Revisa la licencia de cada una antes de un uso comercial.
