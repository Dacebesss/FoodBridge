# Diario

Qué se hizo en cada sesión (lo más reciente arriba). Volver a [[Inicio]].

## 2026-11-12
- `#directo` y la portada sin el QR comprobados por Diego en la web nueva ✅
- **Reparto en 7 partes**: guía por persona en `docs/partes/` y 7 ramas en GitHub (`1-direccion` … `7-legal-datos`).
  A partir de ahora cada uno trabaja en su rama y une a `main` con *pull request* revisado por Diego.

## 2026-11-11
- Web nueva con el nombre del equipo: **https://foodbridgeuem.eu.pythonanywhere.com** (Gmail y cuenta de PythonAnywhere del equipo).
- El QR salía como un cuadrado blanco: se le da tamaño fijo (fallo típico de Safari) y, si no se puede dibujar, se ve la dirección.
- Cambios aplicados en PythonAnywhere (`git pull` → `migrate` → `collectstatic` → Reload).
- **Causa real del cuadrado blanco:** el panel del QR salía también en `/#puente` (sin `#directo`), vacío,
  porque su CSS (`display: grid`) ganaba al atributo `hidden`. Arreglado en `puente.css`: ahora el panel
  solo aparece con `/#directo` y ahí el QR se dibuja bien (comprobado con capturas).
- **Furgonetas con el nombre del comercio** (petición de Diego): en `/directo/` el público escribe primero el
  nombre de su comercio (máx. 24 letras, se recuerda en el móvil) y su furgoneta cruza rotulada con un logo
  de iniciales en un círculo de color y ese nombre. Filtro sencillo de palabrotas (no salen en el proyector).
  `#directo-ensayo` usa comercios inventados. Regla general `[hidden]` en `foodbridge.css`: arreglaba también
  el «¡Tu furgoneta ya está cruzando!» que salía antes de enviar en el móvil.
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
