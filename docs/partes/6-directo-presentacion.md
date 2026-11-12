# 6 · FoodBridge en directo y presentación

**Responsable:** Daniel Panadero · **Rama:** `6-directo-presentacion` · Volver a [[0-reparto]]

## Qué es tu parte
El momento «wow» de la presentación: el público escanea un **QR**, «dona» desde su móvil y en la pantalla grande cruza
una **furgoneta con el nombre de su comercio**. Y además, el **guion** de la presentación y los **ensayos**.

## Tus archivos
| Archivo | Qué es |
|---|---|
| `directo/models.py` | La tabla de **envíos** del público (comercio, producto, unidades, kilos) y el filtro de palabrotas. |
| `directo/views.py` | La página del móvil, recibir un envío y lo que consulta la pantalla grande cada 2 segundos. |
| `directo/management/commands/directo_reiniciar.py` | Pone el contador a cero antes de presentar. |
| `directo/tests.py` | Las pruebas automáticas de esta parte. |
| `templates/directo/movil.html`, `static/js/directo-movil.js`, `static/css/directo.css` | La página que abre el público en su móvil. |
| `static/js/puente.js` (parte «FoodBridge en directo») | Lo que pasa en la pantalla grande: QR, contador y furgonetas. Compártelo con la parte 2. |

## Cómo funciona
- **Pantalla grande:** `https://foodbridgeuem.eu.pythonanywhere.com/#directo` → el puente con el QR y el contador
  de kilos de la sala.
- **Móvil del público** (a donde lleva el QR): `/directo/` → escribe el **nombre de su comercio**, elige un alimento
  y las unidades → *Enviar al puente*.
- La pantalla grande pregunta al servidor cada 2 segundos si hay envíos nuevos. Por cada uno, cruza una furgoneta
  rotulada con las **iniciales y el nombre del comercio**; al llegar a la entidad, suma los kilos al contador.
- **Frenos:** 4 segundos entre envíos del mismo móvil, 15 envíos por móvil y un tope general. Las palabrotas no
  salen en el proyector.
- **No son donaciones reales**: no se mezclan con los lotes de la app.
- **Ensayo sin móviles:** `/#directo-ensayo` simula envíos de comercios inventados.

## Antes de presentar
1. En la consola de PythonAnywhere: `workon foodbridge` → `cd ~/FoodBridge` → `python manage.py directo_reiniciar`.
2. Abrir `/#directo` en el ordenador del proyector, a pantalla completa.
3. Probar el QR con un móvil con datos (no depender del wifi de la clase).

## Guion propuesto (a repartir entre los 7)
1. **La Tierra** — el problema mundial con datos (parte 2 / parte 7).
2. **El puente** — qué es FoodBridge y los tres capítulos (parte 2).
3. **En directo** — el público dona y ve sus furgonetas (parte 6).
4. **Demo real** — publicar con el escáner → reservar → PIN (partes 5, 4 y 3).
5. **Ley y futuro** — Ley 1/2025, comercios reales y cómo crecer (parte 7).
6. **Cierre y equipo** — cómo nos organizamos (parte 1).

## Lo que queda
- [ ] **Ensayo con varios móviles a la vez**, incluido algún Android.
- [ ] Explicar al equipo qué es un QR y cómo se escanea (cámara del móvil, sin app).
- [ ] Cerrar el guion: quién habla en cada parte y cuánto tiempo.
- [ ] Plan B si falla internet: vídeo grabado de `/#directo-ensayo`.

## Preguntas que te puede hacer el profesor
- **¿Es real?** Es una simulación para la presentación; la app real es la demo del escáner y el PIN.
- **¿Cómo llega el envío a la pantalla?** La pantalla pregunta al servidor cada 2 segundos si hay envíos nuevos.
- **¿Y si alguien escribe algo ofensivo?** Hay un filtro de palabras y un límite de envíos por móvil.
