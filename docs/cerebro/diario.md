# Diario

Qué se hizo en cada sesión (lo más reciente arriba). Volver a [[Inicio]].

## 2026-11-11
- Web nueva con el nombre del equipo: **https://foodbridgeuem.eu.pythonanywhere.com** (Gmail y cuenta de PythonAnywhere del equipo).
- El QR salía como un cuadrado blanco: se le da tamaño fijo (fallo típico de Safari) y, si no se puede dibujar, se ve la dirección.
- Cambios aplicados en PythonAnywhere (`git pull` → `migrate` → `collectstatic` → Reload).
- Diego lo prueba en el iPhone: fichas de países, viaje al puente y **FoodBridge en directo funcionando**
  (donación desde el móvil escaneando el QR → furgoneta en la pantalla del ordenador).

## 2026-11-10
- Nueva portada (rama **`puente`**, pendiente de visto bueno): la Tierra centrada; al tocar Villaviciosa
  de Odón, zoom y viaje a un **puente 3D** con furgonetas de FoodBridge. Tres furgonetas abren
  El problema, Nuestro objetivo y Cómo funciona.
- Nuestro objetivo con **mapas reales** (sustituyen a los círculos). Cómo funciona se representa en 3D
  (la furgoneta hace cada paso). Revisión de detalles (texto invisible en el móvil simulado, barra cortada).
- Maqueta para enseñar: https://claude.ai/artifact/4iTjvEsTuv5HizLTVcHDYB
- Fichas de los países en la Tierra (cifra, comparación y fuente) y "modo escaparate".
- **FoodBridge en directo** (rama `puente`): en la presentación, el público escanea un QR, dona desde su
  móvil y en la pantalla grande cruza una furgoneta por cada envío; contador de kilos de la sala.
  Se abre con `/#directo`; para ensayar, `/#directo-ensayo`; contador a cero con `python manage.py directo_reiniciar`.
- Rama `puente` unida con `main` (35 pruebas OK). **Falta aplicarlo en PythonAnywhere** (se hará el día siguiente).

## 2026-11-03
- Diego instala Git y Obsidian; clona el proyecto en PyCharm (carpeta dentro de OneDrive) y lo abre como bóveda.
- Se crea este «cerebro»: `CLAUDE.md` + `docs/cerebro/`.
- Diego pide dejar las «cajas» de momento y probar primero lo que hay.

## 2026-11-02
- Portada nueva en Django: planeta 3D, identidad verde y blanca, logo 2. Estilo nuevo en login, registro y paneles.
- Semana 3 completa: lotes, reservar (el primero gana), PIN de 4 cifras, entrega, cancelar, franjas, registro de donaciones.
- Escáner de código de barras + Open Food Facts. Mejoras: dígito de control, doble lectura, alta resolución,
  enfoque continuo y linterna. **Funciona en iPhone** (probado con salsa de soja).
- **Web publicada en PythonAnywhere**: https://dacebesss.eu.pythonanywhere.com (contraseña del admin cambiada).
- Hecho pero aparcado: publicar por **cajas** (varios productos por lote, cámara continua). Commit `2808c02`.

## Antes (chat anterior)
- Semana 1: maqueta. Semana 2: Django, registro, login, roles y aprobación de ONG.
- Diseño de la portada con el planeta y lista de contactos reales de Villaviciosa.
