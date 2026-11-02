# FoodBridge

App web que conecta los comercios de **Villaviciosa de Odón** con comedores sociales y ONG para aprovechar el excedente alimentario.

1. El **comercio** publica un producto que va a caducar (foto, cantidad, fecha y franja de recogida).
2. Una **ONG** verificada lo reserva. Nadie más puede reservarlo y recibe un **PIN de 4 dígitos**.
3. En la tienda se **valida el PIN** y la donación queda registrada.

Proyecto de la asignatura *Eficacia Personal y Profesional* · 1º de Ingeniería Informática · Universidad Europea de Madrid.

**Equipo:** Diego Acebes · Xinxin Zhu · Daniel Madgwick · Daniel Panadero · Juan Diego Ramírez · Pablo Cabanillas · Diego Fernández

---

## Estado del proyecto

| Semana | Qué incluye | Estado |
|---|---|---|
| 1 | Maqueta visual | ✅ |
| 2 | Proyecto Django, registro, inicio de sesión, roles y aprobación de ONG | ✅ |
| 3 | Publicar lotes, reservar y PIN | ⏳ |
| 4 | Reglas de caducidad, cancelaciones y panel de administrador | ⏳ |
| 5 | Diseño final, estadísticas y publicación en internet | ⏳ |
| 6 | Arreglos y ensayo de la presentación | ⏳ |

---

## Cómo ejecutarlo en tu ordenador (PyCharm)

### Lo que necesitas instalado
- **Python 3.13** → https://www.python.org/downloads/ (en Windows marca *"Add python.exe to PATH"*)
- **PyCharm** → https://www.jetbrains.com/pycharm/download/
- **Git** → https://git-scm.com/downloads

### Paso 1 · Descargar el proyecto
En PyCharm: **File → New → Project from Version Control**, pega esta dirección y pulsa **Clone**:

```
https://github.com/Dacebesss/FoodBridge.git
```

### Paso 2 · Crear el entorno de Python
Al abrirlo, PyCharm suele preguntar si quieres crear un entorno virtual a partir de `requirements.txt`. Di que **sí** y salta al paso 3.

Si no pregunta, abre la pestaña **Terminal** (abajo) y escribe:

```bash
python -m venv .venv
```

Windows:
```bash
.venv\Scripts\activate
```

Mac / Linux:
```bash
source .venv/bin/activate
```

```bash
pip install -r requirements.txt
```

### Paso 3 · Preparar la base de datos (solo la primera vez)
En la Terminal de PyCharm:

```bash
python manage.py migrate
```

```bash
python manage.py datos_demo
```

El segundo comando crea cuentas de prueba (ver abajo).

### Paso 4 · Arrancar la app
```bash
python manage.py runserver
```

Abre en el navegador 👉 **http://127.0.0.1:8000**

Para pararla, pulsa `Ctrl + C` en la Terminal.

---

## Cuentas de prueba

Todas tienen la contraseña **`foodbridge2026`**.

| Email | Tipo | Estado |
|---|---|---|
| `admin@foodbridge.es` | Administrador | — |
| `plaza@foodbridge.es` | Comercio (Supermercado Plaza) | Aprobado |
| `espiga@foodbridge.es` | Comercio (Panadería La Espiga) | Aprobado |
| `sanjose@foodbridge.es` | ONG (Comedor Social San José) | Aprobada |
| `despensa@foodbridge.es` | ONG (Despensa Solidaria El Bosque) | Pendiente |

El panel de administración de Django está en **http://127.0.0.1:8000/admin** (entra con la cuenta de administrador).

---

## Pruebas automáticas

```bash
python manage.py test
```

---

## Cómo está organizado el código

```
foodbridge/            Configuración del proyecto (settings.py, urls.py)
cuentas/               Usuarios: registro, inicio de sesión, roles y aprobación de ONG
  models.py            Qué datos guardamos de cada usuario
  forms.py             Formularios de registro y login
  views.py             Qué página se muestra en cada dirección
  admin.py             Panel de administrador (aprobar / rechazar ONG)
  tests.py             Pruebas automáticas
templates/             Páginas HTML (base.html = cabecera y pie comunes; _logo.html = logo)
static/css/            Estilos: foodbridge.css (común) y portada.css (solo la portada)
static/js/planeta.js   Planeta 3D interactivo de la portada
static/vendor/         Librerías externas guardadas en el proyecto (Three.js 0.160.0, licencia MIT)
docs/capturas/         Capturas de pantalla
```

### Tecnologías
- **Python + Django 5.2**: el framework web.
- **SQLite**: base de datos en un solo archivo.
- **HTML + CSS**: diseño adaptado al móvil. Fuentes Inter y JetBrains Mono; paleta verde y blanco.
- **Three.js**: dibuja el planeta 3D de la portada (se sirve desde `static/vendor/`).

### Uso de IA
El código se ha desarrollado con ayuda de Claude (Anthropic) como herramienta de programación. El equipo ha definido la idea, las reglas de funcionamiento y el diseño, y se encarga de probar la app y gestionar el proyecto.
