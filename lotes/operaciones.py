"""
Las reglas de FoodBridge, en un solo sitio.

Las vistas (las páginas) llaman a estas funciones. Así las reglas se pueden
probar y explicar sin tener que mirar el HTML.
"""

import secrets

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from .models import Lote

MAX_INTENTOS_PIN = 5


def nuevo_pin():
    """PIN aleatorio de 4 cifras, por ejemplo "0427". Usa 'secrets', pensado para seguridad."""
    return f"{secrets.randbelow(10000):04d}"


def lotes_visibles_para(entidad):
    """Lotes que una entidad puede reservar: disponibles, de su municipio y aún a tiempo."""
    hoy = timezone.localdate()
    return (
        Lote.objects.filter(
            estado=Lote.Estado.DISPONIBLE,
            comercio__municipio=entidad.municipio,
            recogida_fin__gt=timezone.now(),
        )
        # Pasada la caducidad no se dona; el consumo preferente sí.
        .filter(Q(tipo_fecha=Lote.TipoFecha.PREFERENTE) | Q(fecha__gte=hoy))
        .select_related("comercio")
        .prefetch_related("productos")
    )


def reservar(lote_id, entidad):
    """
    Intenta reservar un lote. Devuelve el lote reservado o None si ya no se puede.

    "El primero que llega gana": hacemos UNA sola orden a la base de datos que
    dice "pon este lote como reservado SOLO SI todavía está disponible".
    Si dos entidades pulsan a la vez, la base de datos ejecuta las órdenes de una
    en una: la primera cambia 1 fila y la segunda 0, así que pierde.
    """
    if not entidad.puede_reservar:
        return None
    filas = lotes_visibles_para(entidad).filter(pk=lote_id).update(
        estado=Lote.Estado.RESERVADO,
        entidad=entidad,
        pin=nuevo_pin(),
        intentos_pin=0,
        reservado_en=timezone.now(),
    )
    if filas == 0:
        return None
    return Lote.objects.get(pk=lote_id)


def cancelar(lote):
    """
    La entidad cancela su reserva.
    Si al lote le queda al menos 1 día, vuelve a estar disponible para otras.
    Si no, se retira para no ofrecer algo que no dará tiempo a recoger.
    Devuelve True si se ha vuelto a publicar.
    """
    if lote.estado != Lote.Estado.RESERVADO:
        return False
    lote.pin = ""
    lote.intentos_pin = 0
    lote.reservado_en = None
    if lote.puede_volver_a_publicarse:
        lote.estado = Lote.Estado.DISPONIBLE
        lote.entidad = None
        lote.save()
        return True
    lote.estado = Lote.Estado.RETIRADO
    lote.motivo_retirada = "Cancelado por la entidad con menos de un día de margen"
    lote.save()
    return False


def entregar(lote, pin):
    """
    El comercio escribe el PIN que le enseña la entidad.
    Devuelve "ok", "incorrecto" o "pin_nuevo" (tras 5 fallos se cambia el PIN
    para que nadie pueda adivinarlo probando números).
    """
    with transaction.atomic():
        lote = Lote.objects.select_for_update().get(pk=lote.pk)
        if lote.estado != Lote.Estado.RESERVADO:
            return "incorrecto"
        if secrets.compare_digest(pin.strip(), lote.pin):
            lote.estado = Lote.Estado.ENTREGADO
            lote.entregado_en = timezone.now()
            lote.save()
            return "ok"
        lote.intentos_pin += 1
        if lote.intentos_pin >= MAX_INTENTOS_PIN:
            lote.pin = nuevo_pin()
            lote.intentos_pin = 0
            lote.save()
            return "pin_nuevo"
        lote.save()
        return "incorrecto"


def retirar(lote):
    """El comercio quita un lote que nadie ha reservado (por ejemplo, porque ya no lo tiene)."""
    if lote.estado != Lote.Estado.DISPONIBLE:
        return False
    lote.estado = Lote.Estado.RETIRADO
    lote.motivo_retirada = "Retirado por el comercio"
    lote.save()
    return True


def cerrar_franjas_terminadas():
    """
    Si termina la franja de recogida y nadie ha recogido el lote, la reserva se
    libera y el lote se retira. El comercio puede volver a publicarlo con otra franja.
    Se llama cada vez que alguien abre su panel, así no hace falta un reloj aparte.
    """
    return Lote.objects.filter(
        estado__in=[Lote.Estado.DISPONIBLE, Lote.Estado.RESERVADO],
        recogida_fin__lte=timezone.now(),
    ).update(
        estado=Lote.Estado.RETIRADO,
        pin="",
        motivo_retirada="Terminó la franja de recogida sin entrega",
    )
