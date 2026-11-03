# Decisiones

Volver a [[Inicio]]. Ver también [[como-funciona]].

## Tecnología
- **Django 5.2.18 LTS + SQLite + HTML/CSS propios.** Publicado en **PythonAnywhere** (servidores UE).
- **Web adaptada al móvil**, no app nativa.
- Librerías guardadas dentro del proyecto (`static/vendor/`): Three.js 0.160.0 (MIT) y ZXing 0.21.3 (Apache 2.0).
- Datos de productos: **Open Food Facts** (licencia ODbL; hay que citarlo). La búsqueda la hace el móvil, no el servidor.

## Diseño
- Paleta **verde y blanco**: noche `#03110A`, bosque `#14532D`, verde `#22A35A`, menta `#4ADE80`.
  Coral `#F2545B` solo para el desperdicio; ámbar `#F5A524` y turquesa `#0E9F8E` como acentos.
- Fuentes **Inter** + **JetBrains Mono**. Estilo serio, minimalista, con armonía.
- **Logo 2 «Escalón con sombra»** con sus dos verdes, sin toques blancos (`templates/_logo.html`).
  Marca: «Food» en blanco + «Bridge» en menta sobre fondo oscuro.
- **Portada**: planeta Tierra 3D interactivo (puntos rojos: EE. UU., UE, India, Japón; verde: España con zoom a
  Comunidad de Madrid → Villaviciosa). Debajo: cifras, objetivo + Ley 1/2025, cómo funciona, equipo, fuentes.

## Negocio y datos
- Todo son **donaciones** (sin pagos).
- La **demo usa comercios inventados**: poner tiendas reales daría a entender un acuerdo que no existe.
- **Solo datos verificados**, con su fuente (ver [[datos-verificados]]).
- Objetivos del piloto en Villaviciosa:
  1. Conectar los comercios de alimentación con las entidades sociales verificadas del municipio.
  2. Que ningún alimento apto se tire: publicar, reservar y entregar en la misma tarde.
  3. Registrar cada entrega para que los comercios puedan demostrar que donan, como pide la Ley 1/2025.
  4. Crear un modelo que cualquier municipio pueda copiar.

## Descartado (no volver a proponer)
- Flask (habría que programar a mano login, roles y admin). App nativa de móvil. Pagos.
- Logos antiguos A, B, C y D; variantes del logo 2 con toques blancos.
- Azul marino como color principal; paleta original `#1C7549` / `#D9620F`.
- Puente 2D, puente 3D y columnas griegas en la portada; simulador de impacto, planificación y tarjetas de reglas en la portada.
- Titular grande o panel en mitad de la pantalla tapando el planeta.
- Datos no verificados: Brasil (≈94 kg), China (≈76 kg), población de Villaviciosa (29.273), estimación de 714 t.
- Cargar los comercios reales como usuarios de la demo.
- En el escáner, la opción `TRY_HARDER` de ZXing: impide leer los códigos EAN (comprobado).
