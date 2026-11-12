# 2 · Diseño y portada

**Responsable:** Xinxin Zhu · **Rama:** `2-diseno-portada` · Volver a [[0-reparto]]

## Qué es tu parte
Todo lo que se **ve**: la identidad (logo, colores, letras) y la portada en dos escenas, la Tierra 3D y el
puente con las furgonetas.

## Tus archivos
| Archivo | Qué es |
|---|---|
| `static/css/foodbridge.css` | El estilo común. Arriba están los **colores y letras** como variables (`--verde`, `--menta`…): cambiándolos ahí, cambian en toda la web. |
| `static/css/portada.css` | El estilo de la escena de la Tierra. |
| `static/css/puente.css` | El estilo de la escena del puente y de sus capítulos. |
| `static/js/planeta.js` | La Tierra 3D: países con datos, «modo escaparate» y el viaje a Villaviciosa. |
| `static/js/puente.js` | El puente 3D, las furgonetas y los tres capítulos (El problema, Nuestro objetivo, Cómo funciona). |
| `templates/inicio.html` | El HTML de la portada: los textos de los capítulos están aquí. |
| `templates/base.html`, `templates/_logo.html`, `static/img/logo.svg` | La plantilla común (cabecera y pie) y el logo. |

## Cómo funciona
- **Identidad:** verde y blanco, letra *Inter* para textos y *JetBrains Mono* para cifras. Logo «Escalón con sombra».
- **Escena 1, la Tierra** (`planeta.js`, con la librería **Three.js**): una esfera con puntos. Al tocar un país sale
  una ficha con su dato y su fuente. Si nadie toca nada, la Tierra gira y enseña fichas sola («modo escaparate»).
  Solo **Villaviciosa de Odón** responde: hace zoom (España → Madrid → Villaviciosa) y pasa al puente.
- **Escena 2, el puente** (`puente.js`): un puente colgante une el **comercio** (izquierda) con la **entidad social**
  (derecha). Cruzan furgonetas blancas con el logo; tres llevan etiqueta y abren un capítulo. La cámara se mueve a
  una parte distinta del puente en cada capítulo. En «El problema» cae comida roja al agua.
- Todo funciona también con teclado y respeta a quien tiene activado «reducir movimiento» en su móvil.

## Cómo probarlo
Abre `https://foodbridgeuem.eu.pythonanywhere.com`, toca países, toca Villaviciosa y abre los tres capítulos.
Pruébalo en el ordenador y en el móvil, en vertical.

## Lo que queda
- [ ] Revisar textos de los tres capítulos (que se entiendan sin explicación).
- [ ] Probar la portada en un Android y en un móvil pequeño.
- [ ] Capturas buenas para las diapositivas.

## Preguntas que te puede hacer el profesor
- **¿Por qué un puente?** Es la idea de FoodBridge: unir quien tiene comida que sobra con quien la necesita.
- **¿Por qué 3D?** Para que la presentación enganche; la parte útil de la app (paneles, publicar, reservar) es sencilla.
- **¿De dónde salen las cifras de los países?** De fuentes oficiales (UNEP, Eurostat, Ministerio); cada ficha la cita.
