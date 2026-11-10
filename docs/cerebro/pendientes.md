# Pendientes

Volver a [[Inicio]]. Lo de arriba es lo más urgente.

## Ahora
> **Dónde nos quedamos (10/11, noche):** todos los cambios están en GitHub (`main`, commit `afeba6e`),
> pero **NO se han aplicado todavía en PythonAnywhere**: en `/#directo` sigue saliendo la web antigua.
> Mañana, en la consola Bash de PythonAnywhere:
> 1. `cd ~/FoodBridge && git log --oneline -1` → debe salir `afeba6e`. Si no, `git pull` y revisar el error.
> 2. `workon foodbridge` → `python manage.py migrate` → `python manage.py collectstatic --noinput`
>    → `python manage.py directo_reiniciar`.
> 3. Pestaña **Web** → **Reload**. En el iPhone, abrir en pestaña privada para evitar la copia guardada.
> 4. Probar: fichas de los países, viaje al puente, las 3 furgonetas, y FoodBridge en directo
>    (ordenador con `/#directo` + iPhone escaneando el QR).
> 5. Después: explicar a Diego qué es un QR y preparar el guion de la presentación.

- [ ] **Probar la portada nueva en la web** (Tierra → puente con furgonetas, ya en `main`).
      Incluye **FoodBridge en directo**: probarlo con varios móviles reales antes de la presentación.
- [ ] Ensayo general de la presentación con FoodBridge en directo (proyector + móviles del equipo).
- [ ] **Probar lo que llevamos en la web**, por bloques (en el iPhone de Diego):
  1. El comercio publica un producto con el escáner.
  2. La entidad reserva y recibe el PIN.
  3. Entrega con PIN (probar también un PIN incorrecto).
  4. Cancelar una reserva.
  5. Reglas de fechas (no deja publicar algo caducado).
  6. Panel de administrador y alta de una ONG nueva (aprobarla).
- [ ] **Cajas** (varios productos por lote, escáner continuo): hechas pero aparcadas. Guardadas en la rama
      **`cajas`** de GitHub (commit `2808c02`) y quitadas de `main`. Para recuperarlas: `git revert` del commit
      que las quitó, o fusionar la rama `cajas`.
- [ ] Probar el escáner en un **Android** (en iPhone ya funciona).

## Después
- [ ] **Hacer la aplicación de FoodBridge** (después de terminar la web). Opciones a decidir:
      convertir la web en una app instalable desde el navegador (PWA, lo más rápido: icono en la pantalla
      de inicio, pantalla completa) o hacer una app nativa para iPhone y Android (más trabajo). Al principio
      del proyecto se descartó la app nativa por tiempo; Diego quiere retomarlo cuando la web esté lista.
- [ ] **Cambiar el nombre de la web** para que no salga «dacebesss» (p. ej. cuenta nueva `foodbridge` en PythonAnywhere).
- [ ] **Redefinir los roles** del equipo y de la app.
- [ ] **Preparar la visita a un supermercado**: guion de demostración y repaso de que todo funciona.
- [ ] **Cómo dar de alta a un comercio real** (p. ej. Mercadona): quién crea la cuenta, qué datos, qué acepta (con Pablo, legal).
- [ ] Mejorar la explicación de **caducidad / consumo preferente** para que el comercio lo entienda sin ayuda.
- [ ] Decidir qué hacer con el «Supermercado Plaza» de la demo (es inventado a propósito; ¿renombrarlo?).
- [ ] Renovar la web gratuita de PythonAnywhere cuando llegue el email (antes del 14/12).
- [ ] Pablo o Diego Fernández: comprobar en el anexo de UNEP 2024 las cifras de EE. UU. (73 kg) e India (55 kg).
- [ ] Contactar con comercios y entidades reales (ver [[contactos_villaviciosa]]).
