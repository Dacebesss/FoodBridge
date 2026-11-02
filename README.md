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
| 3 | Publicar lotes (con escáner de código de barras), reservar y PIN | ✅ |
| 4 | Reglas de caducidad, cancelaciones y panel de administrador | ✅ (adelantada a la semana 3) |
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

El segundo comando crea cuentas y lotes de prueba (ver abajo). Si los lotes se han quedado viejos (por ejemplo, el día de la presentación), créalos otra vez para hoy:

```bash
python manage.py datos_demo --lotes-nuevos
```

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

Los lotes de ejemplo incluyen uno ya reservado por el Comedor Social San José (con su PIN) y una entrega del día anterior.

El panel de administración de Django está en **http://127.0.0.1:8000/admin** (entra con la cuenta de administrador).

---

## Cómo funciona un lote

Un **lote** es lo que un comercio dona de una vez: un solo producto o una caja con varios.

1. **El comercio publica.** Pulsa «Escanear productos» y va pasando los productos por la cámara uno detrás de otro (*pip, pip, pip*). Cada uno se añade a una lista; si pasa otra vez el mismo, suma una unidad. La web busca cada producto en [Open Food Facts](https://es.openfoodfacts.org) (base de datos libre, licencia ODbL) y pone el nombre, la marca, la categoría, la foto, los alérgenos y el peso. Lo que no tiene código (pan, fruta, verdura…) se añade con botones rápidos. Al final pone **una sola fecha** para todo el lote y la **franja de recogida**, que ya sale rellena con la última que usó la tienda.
2. **Una entidad verificada del mismo municipio reserva.** El primero que llega gana: la base de datos solo deja reservar un lote que siga disponible. La entidad recibe un **PIN de 4 cifras**.
3. **En la tienda, el comercio escribe el PIN** y la entrega queda registrada (fecha, kilos y entidad). Tras 5 PIN incorrectos, el PIN cambia.

Reglas:
- Tres tipos de fecha: **consumo preferente** (lo más habitual; se puede donar aunque haya pasado), **caducidad** (pasada la fecha no se puede donar) y **fresco sin fecha** (fruta, verdura, pan del día: cuenta como fecha el día de recogida).
- Si un lote tiene varios productos, se pone la fecha **del que vence antes**.
- La recogida tiene que ser como tarde el día que caduca.
- Si la entidad **cancela**, el lote vuelve a publicarse solo si le queda al menos 1 día; si no, se retira.
- Si termina la **franja de recogida** sin entrega, la reserva se libera y el lote se retira. El comercio puede pulsar «Publicar de nuevo», que copia todos los productos.

El escáner necesita una conexión segura (HTTPS) para usar la cámara. En el ordenador (`127.0.0.1`) y en PythonAnywhere ya la hay. Funciona en Android y en iPhone (probado en iPhone): si el navegador no sabe leer códigos por sí solo, usa la librería ZXing. Para evitar errores, solo acepta un código si su último número (dígito de control) cuadra y si lo ha leído dos veces seguidas igual.

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
lotes/                 Lotes donados
  models.py            Qué datos guardamos de cada lote y de cada producto de dentro
  operaciones.py       Las reglas: reservar, cancelar, entregar con PIN, cerrar franjas
  forms.py             Formulario de publicar (comprueba fechas y franjas)
  views.py             Páginas y botones de cada acción
  tests/               Pruebas automáticas de los lotes
templates/             Páginas HTML (base.html = cabecera y pie comunes; _logo.html = logo)
static/css/            Estilos: foodbridge.css (común) y portada.css (solo la portada)
static/js/planeta.js   Planeta 3D interactivo de la portada
static/js/escaner.js   Escáner continuo, lista de productos y búsqueda en Open Food Facts
static/vendor/         Librerías externas guardadas en el proyecto (Three.js 0.160.0, MIT; ZXing 0.21.3, Apache 2.0)
docs/capturas/         Capturas de pantalla
```

### Tecnologías
- **Python + Django 5.2**: el framework web.
- **SQLite**: base de datos en un solo archivo.
- **HTML + CSS**: diseño adaptado al móvil. Fuentes Inter y JetBrains Mono; paleta verde y blanco.
- **Three.js**: dibuja el planeta 3D de la portada (se sirve desde `static/vendor/`).
- **Pillow**: permite subir fotos de los productos.
- **ZXing** y **Open Food Facts**: leer el código de barras y obtener los datos del producto.

### Uso de IA
El código se ha desarrollado con ayuda de Claude (Anthropic) como herramienta de programación. El equipo ha definido la idea, las reglas de funcionamiento y el diseño, y se encarga de probar la app y gestionar el proyecto.
