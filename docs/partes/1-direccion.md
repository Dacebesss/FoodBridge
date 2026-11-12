# 1 · Jefe de proyecto

**Responsable:** Diego Acebes · **Rama:** `1-direccion` · Volver a [[0-reparto]]

## Qué es tu parte
Que el proyecto llegue entero y a tiempo al **14/12/2026**: planificar, repartir, revisar el trabajo de los
demás antes de unirlo a `main`, mantener la web publicada y coordinar la presentación.

## Tus archivos
| Archivo | Qué es |
|---|---|
| `README.md` | La portada del repositorio en GitHub: qué es FoodBridge y cómo probarlo. |
| `CLAUDE.md` | Las instrucciones que lee Claude al empezar cada sesión. |
| `docs/cerebro/` | Las notas del proyecto (Obsidian): [[pendientes]], [[diario]], [[decisiones]], [[equipo]]. |
| `docs/cerebro/publicar-web.md` | Cómo actualizar la web en PythonAnywhere. |
| `foodbridge/settings.py` | La configuración general de Django (idioma, zona horaria, base de datos). |
| `requirements.txt` | Las librerías de Python que necesita la web (Django y Pillow). |

## Cómo funciona
- **GitHub** guarda el código. `main` es la versión buena; cada parte trabaja en su rama y pide unirla con un
  *pull request*.
- **PythonAnywhere** publica la web: `https://foodbridgeuem.eu.pythonanywhere.com`. Para actualizarla:
  `workon foodbridge` → `cd ~/FoodBridge && git pull` → `python manage.py migrate` →
  `python manage.py collectstatic --noinput` → pestaña *Web* → *Reload*.
- **Las pruebas automáticas** (`python manage.py test`) comprueban las reglas de la app. Antes de unir algo a
  `main`, tienen que salir todas bien (`OK`).

## Cómo revisar un pull request
1. Lee la descripción: qué cambia y por qué.
2. Mira los archivos cambiados (pestaña *Files changed*). ¿Tocan solo su parte?
3. Pruébalo en tu ordenador o pide que lo prueben, y comprueba que las pruebas salen bien.
4. Si está bien: *Merge*. Después, actualiza la web en PythonAnywhere.

## Lo que queda
- [ ] Cambiar la contraseña de la cuenta de PythonAnywhere (la antigua era pública).
- [ ] Calendario hasta el 14/12 con una fecha límite por parte.
- [ ] Ensayo general con todo el equipo.
- [ ] Renovar la web gratuita de PythonAnywhere cuando llegue el email.

## Preguntas que te puede hacer el profesor
- **¿Cómo os habéis organizado?** Una base común y después 7 áreas con un responsable cada una, ramas en
  GitHub y revisión antes de unir.
- **¿Cómo habéis usado la IA?** Está declarado en el README: Claude escribe código y cada responsable lo
  revisa, lo prueba y lo explica.
- **¿Qué haríais distinto?** Repartir las áreas desde el principio.
