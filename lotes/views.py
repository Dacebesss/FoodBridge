"""
Vistas de la app "lotes": publicar, reservar, cancelar, entregar y retirar.

Las acciones que cambian algo solo aceptan POST (un formulario con botón),
nunca un simple enlace, para que no se puedan disparar por error.
"""

from functools import wraps

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from . import operaciones
from .forms import LoteForm
from .models import Lote


def solo_comercios(vista):
    @wraps(vista)
    @login_required
    def envoltura(request, *args, **kwargs):
        if not request.user.es_comercio:
            raise PermissionDenied
        return vista(request, *args, **kwargs)
    return envoltura


def solo_entidades(vista):
    @wraps(vista)
    @login_required
    def envoltura(request, *args, **kwargs):
        if not request.user.es_ong:
            raise PermissionDenied
        return vista(request, *args, **kwargs)
    return envoltura


@solo_comercios
def publicar(request):
    if request.method == "POST":
        form = LoteForm(request.POST, request.FILES)
        if form.is_valid():
            lote = form.save(commit=False)
            lote.comercio = request.user
            lote.save()
            messages.success(request, f"«{lote.nombre}» publicado. Las entidades de tu zona ya lo ven.")
            return redirect("cuentas:panel")
    else:
        inicial = {}
        # "Publicar de nuevo": copia los datos de un lote anterior del mismo comercio.
        copiar = request.GET.get("copiar")
        if copiar and copiar.isdigit():
            origen = Lote.objects.filter(pk=copiar, comercio=request.user).first()
            if origen:
                for campo in ["codigo_barras", "nombre", "marca", "categoria", "foto_url",
                              "unidades", "kg", "tipo_fecha", "fecha", "alergenos", "observaciones"]:
                    inicial[campo] = getattr(origen, campo)
        form = LoteForm(initial=inicial)
    return render(request, "lotes/publicar.html", {"form": form})


@require_POST
@solo_entidades
def reservar(request, pk):
    lote = operaciones.reservar(pk, request.user)
    if lote is None:
        messages.error(request, "Lo sentimos: otra entidad lo ha reservado antes o ya no está disponible.")
    else:
        messages.success(request, f"Reservado. Enseña el PIN {lote.pin} en {lote.comercio.nombre_entidad}.")
    return redirect("cuentas:panel")


@require_POST
@solo_entidades
def cancelar(request, pk):
    lote = get_object_or_404(Lote, pk=pk, entidad=request.user, estado=Lote.Estado.RESERVADO)
    if operaciones.cancelar(lote):
        messages.info(request, "Reserva cancelada. El lote vuelve a estar disponible para otras entidades.")
    else:
        messages.info(request, "Reserva cancelada. Como queda menos de un día, el lote se ha retirado.")
    return redirect("cuentas:panel")


@require_POST
@solo_comercios
def entregar(request, pk):
    lote = get_object_or_404(Lote, pk=pk, comercio=request.user)
    resultado = operaciones.entregar(lote, request.POST.get("pin", ""))
    if resultado == "ok":
        messages.success(request, f"Entrega confirmada: «{lote.nombre}» queda registrado como donado.")
    elif resultado == "pin_nuevo":
        messages.error(request, "Demasiados intentos. Hemos cambiado el PIN: pide a la entidad que mire su panel.")
    else:
        messages.error(request, "El PIN no es correcto. Compruébalo con la entidad.")
    return redirect("cuentas:panel")


@require_POST
@solo_comercios
def retirar(request, pk):
    lote = get_object_or_404(Lote, pk=pk, comercio=request.user)
    if operaciones.retirar(lote):
        messages.info(request, f"«{lote.nombre}» retirado.")
    else:
        messages.error(request, "Solo se pueden retirar lotes que nadie ha reservado.")
    return redirect("cuentas:panel")
