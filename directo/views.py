"""Vistas de FoodBridge en directo: la página del móvil y lo que consulta la pantalla grande."""

import json
import time
from decimal import Decimal

from django.db.models import Count, Sum
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST

from .models import PRODUCTOS, Envio, limpiar_comercio

ESPERA_ENTRE_ENVIOS = 4      # segundos entre dos envíos del mismo móvil
MAX_POR_MOVIL = 15           # envíos por móvil y sesión
MAX_GLOBAL_10_MIN = 400      # freno general por si alguien abusa


def movil(request):
    """La página que abre el público al escanear el QR."""
    # Los kilos van como texto con punto ("0.125"), que es lo que entiende el JavaScript.
    productos = [{"clave": k, "nombre": v[0], "kg": str(v[2])} for k, v in PRODUCTOS.items()]
    return render(request, "directo/movil.html", {"productos": productos})


@require_POST
def enviar(request):
    try:
        datos = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        datos = {}
    producto = datos.get("producto")
    try:
        unidades = int(datos.get("unidades"))
    except (TypeError, ValueError):
        unidades = 0
    if producto not in PRODUCTOS or not 1 <= unidades <= 20:
        return JsonResponse({"ok": False, "error": "Elige un producto y entre 1 y 20 unidades."}, status=400)
    comercio = limpiar_comercio(datos.get("comercio"))
    if not comercio:
        return JsonResponse({"ok": False, "error": "Escribe el nombre de tu comercio (sin palabrotas 😉)."}, status=400)

    # Frenos para que nadie llene la pantalla: por móvil (sesión) y en general.
    ahora = time.time()
    historial = [t for t in request.session.get("directo_envios", []) if ahora - t < 3600]
    if historial and ahora - historial[-1] < ESPERA_ENTRE_ENVIOS:
        return JsonResponse({"ok": False, "error": "Espera un momento: tu furgoneta acaba de salir."}, status=429)
    if len(historial) >= MAX_POR_MOVIL:
        return JsonResponse({"ok": False, "error": "¡Gracias! Ya has enviado muchas furgonetas."}, status=429)
    hace_10_min = timezone.now() - timezone.timedelta(minutes=10)
    if Envio.objects.filter(creado__gte=hace_10_min).count() >= MAX_GLOBAL_10_MIN:
        return JsonResponse({"ok": False, "error": "El puente está lleno. Prueba en un minuto."}, status=429)

    kg = (Decimal(str(PRODUCTOS[producto][2])) * unidades).quantize(Decimal("0.01"))
    envio = Envio.objects.create(comercio=comercio, producto=producto, unidades=unidades, kg=kg)
    historial.append(ahora)
    request.session["directo_envios"] = historial
    return JsonResponse({"ok": True, "id": envio.id, "texto": envio.texto})


@require_GET
def estado(request):
    """La pantalla grande pregunta cada 2 segundos: «¿hay envíos nuevos desde el número X?»."""
    try:
        desde = int(request.GET.get("desde", 0))
    except ValueError:
        desde = 0
    total = Envio.objects.aggregate(n=Count("id"), kg=Sum("kg"))
    nuevos = list(Envio.objects.filter(id__gt=desde).order_by("id")[:40]) if desde >= 0 else []
    anteriores = Envio.objects.filter(id__lte=desde).count() if nuevos else 0
    return JsonResponse({
        "ultimo": Envio.objects.order_by("-id").values_list("id", flat=True).first() or 0,
        "total": {"lotes": total["n"], "kg": float(total["kg"] or 0)},
        "envios": [
            {"id": e.id, "numero": anteriores + i + 1, "comercio": e.comercio, "producto": e.producto, "texto": e.texto, "kg": float(e.kg)}
            for i, e in enumerate(nuevos)
        ],
    })
