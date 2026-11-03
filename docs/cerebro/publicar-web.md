# Publicar y actualizar la web

Volver a [[Inicio]].

- Web: https://dacebesss.eu.pythonanywhere.com · cuenta de PythonAnywhere (UE) del usuario `Dacebesss`.
- Carpeta del proyecto en el servidor: `/home/Dacebesss/FoodBridge` · entorno: `foodbridge` (Python 3.12).
- La clave secreta y la contraseña del admin están SOLO en PythonAnywhere (archivo WSGI). Nunca aquí.

## Actualizar la web cuando hay cambios en GitHub
En PythonAnywhere: **☰ → Consoles → Bash**, y uno a uno:
```bash
workon foodbridge
```
```bash
cd ~/FoodBridge && git pull
```
```bash
python manage.py migrate
```
```bash
python manage.py collectstatic --noinput
```
Después: **☰ → Web → Reload**. En el móvil, cerrar la pestaña y volver a abrir la web.

## Recrear los lotes de la demo (p. ej. el día de la presentación)
```bash
python manage.py datos_demo --lotes-nuevos
```

## Si algo falla
**Web → Log files → Error log**: copiar las últimas líneas y pasárselas a Claude.

## Recordatorios
- La cuenta gratuita hay que **renovarla** cuando llega el email (botón en la pestaña Web). Hacerlo antes del 14/12.
- La cámara del escáner solo funciona con **HTTPS** (activado: «Force HTTPS»).
