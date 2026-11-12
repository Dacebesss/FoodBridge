# 4 · Lotes y entregas

**Responsable:** Diego Fernández · **Rama:** `4-lotes-entregas` · Volver a [[0-reparto]]

## Qué es tu parte
El corazón de FoodBridge: el comercio **publica** comida, una entidad la **reserva**, recibe un **PIN** y en la
tienda se **entrega**. También las cancelaciones y las reglas de fechas.

## Tus archivos
| Archivo | Qué es |
|---|---|
| `lotes/models.py` | La tabla de **lotes**: producto, kilos, fecha del envase, franja de recogida, estado, PIN… |
| `lotes/operaciones.py` | **Las reglas**, todas en un sitio: reservar, cancelar, entregar con PIN, retirar, cerrar franjas. |
| `lotes/forms.py` | El formulario de publicar y sus comprobaciones (fechas, kilos, código de barras). |
| `lotes/views.py` | Las páginas y botones: publicar, reservar, cancelar, entregar, retirar. |
| `lotes/tests/test_lotes.py` | Las pruebas automáticas de las reglas. |
| `templates/lotes/` | El HTML del formulario de publicar y de la tarjeta de cada lote. |

## Cómo funciona
1. **Publicar:** el comercio indica producto, unidades, kilos, **tipo de fecha** (caducidad o consumo preferente),
   la fecha del envase y la **franja de recogida** (día y horas).
2. **Reservar — «el primero que llega gana»:** si dos entidades pulsan a la vez, la base de datos hace la reserva en
   **una sola orden** («resérvalo solo si sigue disponible»): la primera gana y la segunda recibe un aviso.
3. **PIN de 4 cifras:** al reservar, la entidad recibe un PIN aleatorio. En la tienda, el comercio lo escribe y la
   entrega queda **registrada** (fecha, kilos y entidad). Tras **5 PIN incorrectos**, el PIN cambia, para que nadie lo
   adivine probando.
4. **Estados de un lote:** disponible → reservado → entregado (o retirado).

**Reglas de fechas:**
- **Consumo preferente:** se puede donar aunque haya pasado (solo pierde calidad).
- **Caducidad:** pasada la fecha **no** se puede donar, y la recogida tiene que ser como tarde ese día.

**Cancelaciones y franjas:**
- Si la entidad cancela, el lote vuelve a publicarse solo si le queda **al menos 1 día**; si no, se retira.
- Si termina la franja sin entrega, la reserva se libera y el lote se retira. El comercio puede publicarlo de nuevo.

## Cómo probarlo
Entra como `plaza@foodbridge.es`, publica un lote; entra como `sanjose@foodbridge.es` en otro navegador, resérvalo y
apunta el PIN; vuelve al comercio y escribe el PIN (prueba también uno mal). Contraseña: `foodbridge2026`.
Para las pruebas automáticas: `python manage.py test lotes`.

## Lo que queda
- [ ] Probar todo el ciclo en el móvil (publicar → reservar → PIN → entregar → cancelar).
- [ ] Explicar mejor en pantalla la diferencia entre caducidad y consumo preferente.
- [ ] Un justificante de las entregas para el comercio (Ley 1/2025), junto con la parte 7.

## Preguntas que te puede hacer el profesor
- **¿Qué pasa si dos ONG reservan a la vez?** La base de datos lo resuelve en una sola orden: solo una lo consigue.
- **¿Por qué un PIN?** Para demostrar que la comida llegó a la entidad que la reservó, sin papeles.
- **¿Por qué se puede donar algo pasado de fecha?** Solo si es «consumo preferente», que no es peligroso; la caducidad, nunca.
