# Cómo funciona la app

Volver a [[Inicio]].

## Quién es quién
- **Comercio**: se registra y puede publicar al momento.
- **Entidad social (ONG, comedor)**: se registra con su nº de registro o CIF y **espera a que un administrador la apruebe**.
  Solo ve los lotes de **su municipio**.
- **Administrador**: aprueba o rechaza entidades desde `/admin`.

## Un lote, paso a paso
1. **El comercio publica**: escanea el código de barras (o lo escribe) y la web rellena nombre, marca, categoría,
   foto, alérgenos y kg con Open Food Facts. El comercio añade la **fecha del envase** y la **franja de recogida**.
2. **Una entidad reserva**: el primero que llega gana (la base de datos solo deja reservar un lote disponible).
   Recibe un **PIN de 4 cifras**.
3. **En la tienda**, el comercio escribe el PIN → **entrega registrada** (fecha, kg y entidad). Tras 5 PIN mal, el PIN cambia.

## Reglas de las fechas
- **Consumo preferente** («consumir preferentemente antes de»): lo más habitual. Se puede donar aunque haya pasado.
- **Caducidad**: pasada la fecha **no** se puede donar. La recogida tiene que ser como tarde ese día.
- Si el envase dice «ver tapa», «ver cuello» o «ver base», la fecha está impresa allí.

## Cancelaciones y franjas
- Si la entidad **cancela**: el lote vuelve a publicarse solo si le queda **≥ 1 día**; si no, se retira.
- Si termina la **franja de recogida** sin entrega: la reserva se libera y el lote se retira.
  El comercio puede pulsar «Publicar de nuevo».

## Cuentas de prueba (contraseña `foodbridge2026`)
- `plaza@foodbridge.es` (Supermercado Plaza, inventado) · `espiga@foodbridge.es` (Panadería La Espiga, inventada)
- `sanjose@foodbridge.es` (Comedor Social San José, aprobado) · `despensa@foodbridge.es` (pendiente de aprobar)
- El administrador tiene otra contraseña en la web publicada (no se apunta aquí).
