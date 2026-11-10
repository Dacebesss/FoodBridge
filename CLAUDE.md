# FoodBridge · instrucciones para Claude

> Claude lee este archivo al empezar cada sesión. Es la memoria del proyecto.
> Más detalle en `docs/cerebro/` (se abre con Obsidian): empieza por `docs/cerebro/Inicio.md`.
> ⚠️ El repositorio es PÚBLICO: aquí nunca van contraseñas, claves ni datos personales.

## Qué es
App web (Python/Django) de un proyecto de clase: un comercio de **Villaviciosa de Odón** publica comida
a punto de caducar → una **entidad social verificada** la reserva (queda bloqueada y recibe un **PIN de 4 cifras**)
→ en la tienda se escribe el PIN y la entrega queda registrada (sirve para la **Ley 1/2025**).
Pensada para poder crecer a otros municipios (cada cuenta guarda su municipio).

- Equipo de 7 alumnos de 1.º de Ingeniería Informática (UEM, Madrid). Asignatura: Eficacia Personal y Profesional
  (valora equipo, planificación y presentación más que el código). **Presentación: 14/12/2026.**
- Habla normalmente **Diego Acebes**, jefe de proyecto. Nivel de programación muy básico. Usa iPhone, Windows, PyCharm y Obsidian.
- Web publicada: https://dacebesss.eu.pythonanywhere.com (PythonAnywhere, servidores de la UE).

## Cómo trabajar con Diego
- **Español, claro y didáctico**, paso a paso y sin jerga. Un paso cada vez cuando se lía.
- **Antes de programar algo nuevo: explicar, recomendar y enseñar cómo quedará** (captura o enlace).
  "Me fío de tu criterio" = decide tú.
- Estilo **serio, profesional, moderno, minimalista**, sin sobrecargar. No cambiar la estética sin motivo.
- **Solo datos verificados, con su fuente.** Si un dato no es seguro, se quita o se verifica.
- Le gusta compartir enlaces por WhatsApp. Si una espera es larga, dar avances breves.
- Comprobar siempre: `python manage.py test` y prueba en navegador (Playwright) con capturas.
- Commits: autor `Diego Acebes <dacezasolucionessl@gmail.com>` + líneas de coautoría de Claude. Rama `main`.
  Push a `https://github.com/Dacebesss/FoodBridge.git`.
- Al terminar una sesión: **actualizar `docs/cerebro/diario.md` y `docs/cerebro/pendientes.md`**.

## Técnica (resumen)
- Django 5.2.18 LTS + SQLite + HTML/CSS propios. Pillow para fotos. Apps: `cuentas` (usuarios y roles), `lotes` y `directo` (simulación para la presentación).
- Login con email. Roles: comercio (aprobado al registrarse), ONG/entidad (pendiente hasta que la apruebe un admin;
  nº de registro o CIF obligatorio) y admin.
- Reglas de los lotes en `lotes/operaciones.py`. Escáner en `static/js/escaner.js` (ZXing 0.21.3 o lector nativo
  + Open Food Facts). Portada en dos escenas: planeta 3D (`static/js/planeta.js`, Three.js 0.160.0) y puente 3D con furgonetas (`static/js/puente.js`); `/#directo` = modo en directo. Librerías en `static/vendor/`.
- Datos de demo: `python manage.py datos_demo` (cuentas inventadas, contraseña `foodbridge2026`;
  `--lotes-nuevos` recrea los lotes para hoy). Los comercios de la demo son INVENTADOS a propósito.

## Estado ahora mismo
Ver `docs/cerebro/pendientes.md` (lo siguiente) y `docs/cerebro/diario.md` (lo último que se hizo).
