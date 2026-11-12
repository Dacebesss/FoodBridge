# 5 · Escáner de productos

**Responsable:** Daniel Madgwick · **Rama:** `5-escaner` · Volver a [[0-reparto]]

## Qué es tu parte
Que el comercio publique un producto **escaneando su código de barras** con el móvil, sin escribir casi nada.

## Tus archivos
| Archivo | Qué es |
|---|---|
| `static/js/escaner.js` | Todo el escáner: abre la cámara, lee el código, lo busca en Open Food Facts y rellena el formulario. |
| `static/vendor/` | La librería **ZXing** (lee códigos de barras), guardada en el proyecto para que no dependa de internet. |
| `lotes/forms.py` (`digito_de_control_correcto`) | La misma comprobación del código, repetida en el servidor. Compártelo con la parte 4. |
| `templates/lotes/publicar.html` | La pantalla de publicar, con el botón de escanear. |

## Cómo funciona
1. **Cámara:** abre la cámara trasera en alta resolución, con enfoque continuo y **linterna** si el móvil la tiene.
2. **Lectura:** lee códigos EAN-13, EAN-8 y UPC-A. Si el navegador sabe leerlos solo (Chrome en Android), lo usa;
   si no (iPhone), usa **ZXing**.
3. **Para no equivocarse:** solo acepta un código si su **dígito de control** cuadra (el último número es una cuenta
   de los demás) y si lo ha leído **dos veces seguidas igual**.
4. **Open Food Facts:** busca el código en esta base de datos libre de alimentos y rellena **nombre, marca, categoría,
   foto, alérgenos y kilos**. La búsqueda la hace el móvil, no nuestro servidor.
5. **La fecha y la franja de recogida las pone siempre el comercio**: un código de barras no dice cuándo caduca *ese* envase.
6. Si no hay cámara o el producto no está en la base de datos, se puede escribir el código o los datos a mano.

> Descartado: la opción `TRY_HARDER` de ZXing, porque impedía leer los EAN.

## Cómo probarlo
Entra en el móvil como `plaza@foodbridge.es` (contraseña `foodbridge2026`) → *Publicar* → *Escanear* y apunta a
cualquier producto de casa. **En iPhone funciona** (probado con una salsa de soja).

## Lo que queda
- [ ] **Probarlo en Android** (todavía no se ha hecho).
- [ ] Probar con productos difíciles: latas curvas, poca luz, códigos pequeños, fruta a granel (sin código).
- [ ] Hacer una lista de qué productos encuentra Open Food Facts y cuáles no.
- [ ] Más adelante: publicar varios productos de una vez («cajas», aparcado en la rama `cajas`).

## Preguntas que te puede hacer el profesor
- **¿Qué pasa si el producto no está en Open Food Facts?** Se rellenan los datos a mano; el escáner solo ahorra tiempo.
- **¿Cómo evitáis lecturas erróneas?** Dígito de control y doble lectura.
- **¿Por qué no se lee la fecha de caducidad?** El código de barras identifica el producto, no el envase concreto.
