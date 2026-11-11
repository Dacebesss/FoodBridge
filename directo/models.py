"""
FoodBridge en directo: una simulación para la presentación.

El público escanea un QR con su móvil, elige un alimento y lo "envía al puente".
En la pantalla grande sale una furgoneta con ese lote. NO son donaciones reales:
no se mezclan con los lotes de la app.
"""

import re

from django.db import models

# clave: (nombre en el botón, cómo se dice en plural, kg por unidad)
PRODUCTOS = {
    "pan": ("Pan", "barras de pan", 0.25),
    "bolleria": ("Bollería", "piezas de bollería", 0.08),
    "fruta": ("Fruta", "kg de fruta", 1.0),
    "verdura": ("Verdura", "kg de verdura", 1.0),
    "yogures": ("Yogures", "yogures", 0.125),
    "leche": ("Leche", "litros de leche", 1.0),
    "platos": ("Platos preparados", "platos preparados", 0.4),
    "conservas": ("Conservas", "latas de conserva", 0.4),
}


# Palabras que no queremos ver proyectadas en la pantalla grande (lista corta, a propósito).
PALABRAS_VETADAS = (
    "puta", "puto", "mierda", "polla", "coño", "cabron", "cabrón", "gilipollas", "joder", "follar",
    "maricon", "maricón", "zorra", "subnormal", "retrasado", "nazi", "hitler", "pene", "culo",
)


def limpiar_comercio(texto):
    """Devuelve el nombre del comercio listo para la pantalla, o "" si no vale."""
    nombre = " ".join(str(texto or "").split())[:24]
    if len(nombre) < 2:
        return ""
    palabras = re.findall(r"\w+", nombre.lower())
    if any(p in PALABRAS_VETADAS for p in palabras):
        return ""
    return nombre


class Envio(models.Model):
    comercio = models.CharField("comercio", max_length=24, default="")
    producto = models.CharField("producto", max_length=20, choices=[(k, v[0]) for k, v in PRODUCTOS.items()])
    unidades = models.PositiveSmallIntegerField("unidades")
    kg = models.DecimalField("kg", max_digits=6, decimal_places=2)
    creado = models.DateTimeField("enviado el", auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "envío en directo"
        verbose_name_plural = "envíos en directo"
        ordering = ["id"]

    def __str__(self):
        return self.texto

    @property
    def texto(self):
        """Por ejemplo: «6 yogures · 0,75 kg»."""
        kg = f"{self.kg:.2f}".rstrip("0").rstrip(".").replace(".", ",")
        return f"{self.unidades} {PRODUCTOS[self.producto][1]} · {kg} kg"
