# FoodBridge

App web que conecta los comercios de **Villaviciosa de Odón** con comedores sociales y ONG para aprovechar el excedente alimentario.

1. El **comercio** publica un producto que va a caducar (foto, cantidad, fecha y franja de recogida).
2. Una **ONG** verificada lo reserva. Nadie más puede reservarlo y recibe un **PIN de 4 dígitos**.
3. En la tienda se **valida el PIN** y la donación queda registrada.

Proyecto de la asignatura *Eficacia Personal y Profesional* · 1º de Ingeniería Informática · Universidad Europea de Madrid.

**Equipo** (una parte del proyecto cada uno; guías en [`docs/partes/`](docs/partes/0-reparto.md)):

| Parte | Responsable |
|---|---|
| 1 · Jefe de proyecto | Diego Acebes |
| 2 · Diseño y portada | Xinxin Zhu |
| 3 · Cuentas y roles | Juan Diego Ramírez |
| 4 · Lotes y entregas | Diego Fernández |
| 5 · Escáner de productos | Daniel Madgwick |
| 6 · FoodBridge en directo y presentación | Daniel Panadero |
| 7 · Legal, datos y comercios reales | Pablo Cabanillas |

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

1. **El comercio publica.** Puede escanear el código de barras con la cámara del móvil: la web busca el producto en [Open Food Facts](https://es.openfoodfacts.org) (base de datos libre, licencia ODbL) y rellena el nombre, la marca, la categoría, la foto, los alérgenos y los kilos. El comercio solo añade la fecha del envase y la franja de recogida. Si el producto no tiene código o no está en la base de datos, se rellena a mano.
2. **Una entidad verificada del mismo municipio reserva.** El primero que llega gana: la base de datos solo deja reservar un lote que siga disponible. La entidad recibe un **PIN de 4 cifras**.
3. **En la tienda, el comercio escribe el PIN** y la entrega queda registrada (fecha, kilos y entidad). Tras 5 PIN incorrectos, el PIN cambia.

Reglas:
- Pasada la **fecha de caducidad** no se puede donar. Pasado el **consumo preferente**, sí.
- La recogida tiene que ser como tarde el día que caduca.
- Si la entidad **cancela**, el lote vuelve a publicarse solo si le queda al menos 1 día; si no, se retira.
- Si termina la **franja de recogida** sin entrega, la reserva se libera y el lote se retira. El comercio puede pulsar «Publicar de nuevo».

El escáner necesita una conexión segura (HTTPS) para usar la cámara. En el ordenador (`127.0.0.1`) y en PythonAnywhere ya la hay. Funciona en Android y en iPhone: si el navegador no sabe leer códigos por sí solo, usa la librería ZXing.

---

## FoodBridge en directo (para la presentación)

Una simulación para que el público participe con su móvil:

1. En la pantalla grande abre la web con **`/#directo`** al final (por ejemplo `https://…pythonanywhere.com/#directo`). Sale el puente con un **código QR** y un contador.
2. El público escanea el QR, elige un alimento y una cantidad y pulsa **«Enviar al puente»**.
3. En la pantalla sale una furgoneta con ese lote; al llegar a la entidad se suma al contador de kilos de la sala.

- Solo se eligen productos de una lista (sin texto libre) y cada móvil tiene un límite de envíos.
- **No son donaciones reales**: van a una tabla aparte y no se mezclan con los lotes de la app.
- Antes de cada presentación, pon el contador a cero: `python manage.py directo_reiniciar`.
- Para ensayar sin público: **`/#directo-ensayo`** (envíos simulados, no necesita a nadie).

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
directo/               FoodBridge en directo: envíos del público durante la presentación
lotes/                 Lotes donados
  models.py            Qué datos guardamos de cada lote
  operaciones.py       Las reglas: reservar, cancelar, entregar con PIN, cerrar franjas
  forms.py             Formulario de publicar (comprueba fechas y franjas)
  views.py             Páginas y botones de cada acción
  tests/               Pruebas automáticas de los lotes
templates/             Páginas HTML (base.html = cabecera y pie comunes; _logo.html = logo)
static/css/            Estilos: foodbridge.css (común) y portada.css (solo la portada)
static/js/planeta.js   Planeta 3D interactivo de la portada
static/js/escaner.js   Escáner de códigos de barras y búsqueda en Open Food Facts
static/js/puente.js    Escena del puente 3D (furgonetas, capítulos y modo en directo)
static/vendor/         Librerías externas guardadas en el proyecto (Three.js 0.160.0, MIT; ZXing 0.21.3, Apache 2.0; qrcode-generator 1.4.4, MIT)
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
