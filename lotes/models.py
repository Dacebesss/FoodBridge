"""
Modelo de la app "lotes".

Un lote es lo que un comercio dona de una vez: puede ser un solo producto
("6 packs de yogures") o una caja con varios ("yogures, pan y fruta").
Cada producto de dentro se guarda en ProductoLote.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone


class Lote(models.Model):
    class Categoria(models.TextChoices):
        FRUTA_VERDURA = "fruta_verdura", "Fruta y verdura"
        PAN_BOLLERIA = "pan_bolleria", "Pan y bollería"
        LACTEOS = "lacteos", "Lácteos y huevos"
        CARNE_PESCADO = "carne_pescado", "Carne y pescado"
        PLATOS = "platos", "Platos preparados"
        DESPENSA = "despensa", "Despensa"
        CONGELADOS = "congelados", "Congelados"
        BEBIDAS = "bebidas", "Bebidas"
        OTROS = "otros", "Otros"
        VARIADO = "variado", "Variado"

    class TipoFecha(models.TextChoices):
        # Pasada la fecha de caducidad NO se puede donar (riesgo para la salud).
        CADUCIDAD = "caducidad", "Fecha de caducidad"
        # Pasada la de consumo preferente SÍ se puede donar (solo pierde calidad).
        PREFERENTE = "preferente", "Consumo preferente"
        # Fruta, verdura o pan del día: no traen fecha. Se toma el día de recogida.
        FRESCO = "fresco", "Fresco sin fecha"

    class Estado(models.TextChoices):
        DISPONIBLE = "disponible", "Disponible"
        RESERVADO = "reservado", "Reservado"
        ENTREGADO = "entregado", "Entregado"
        RETIRADO = "retirado", "Retirado"

    # --- Quién lo dona ---
    comercio = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="lotes_publicados", verbose_name="comercio",
    )

    # --- Resumen de lo que contiene. Se calcula solo a partir de sus productos
    #     (ver ProductoLote): así las tarjetas y las búsquedas son sencillas. ---
    codigo_barras = models.CharField("código de barras", max_length=14, blank=True)
    nombre = models.CharField("producto", max_length=120)
    marca = models.CharField("marca", max_length=80, blank=True)
    categoria = models.CharField("categoría", max_length=20, choices=Categoria.choices)
    foto = models.ImageField("foto", upload_to="lotes/%Y/%m/", blank=True)
    foto_url = models.URLField(
        "foto de Open Food Facts", blank=True,
        help_text="Se rellena sola al escanear un producto que está en Open Food Facts.",
    )
    alergenos = models.CharField("alérgenos", max_length=200, blank=True)
    observaciones = models.CharField(
        "observaciones", max_length=200, blank=True,
        help_text="Por ejemplo: mantener en frío, traer cajas…",
    )

    # --- Cuánto ---
    unidades = models.PositiveIntegerField("unidades")
    kg = models.DecimalField("peso total (kg)", max_digits=7, decimal_places=2)

    # --- Fechas ---
    tipo_fecha = models.CharField("tipo de fecha", max_length=12, choices=TipoFecha.choices)
    fecha = models.DateField("fecha que aparece en el envase")
    recogida_inicio = models.DateTimeField("recogida desde")
    recogida_fin = models.DateTimeField("recogida hasta")

    # --- Estado de la donación ---
    estado = models.CharField(
        "estado", max_length=12, choices=Estado.choices, default=Estado.DISPONIBLE
    )
    entidad = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="lotes_reservados", verbose_name="entidad que lo reserva",
    )
    pin = models.CharField("PIN de recogida", max_length=4, blank=True)
    intentos_pin = models.PositiveSmallIntegerField("intentos de PIN fallidos", default=0)
    motivo_retirada = models.CharField("motivo de la retirada", max_length=120, blank=True)

    creado_en = models.DateTimeField("publicado el", auto_now_add=True)
    reservado_en = models.DateTimeField("reservado el", null=True, blank=True)
    entregado_en = models.DateTimeField("entregado el", null=True, blank=True)

    class Meta:
        verbose_name = "lote"
        verbose_name_plural = "lotes"
        ordering = ["recogida_fin"]

    def __str__(self):
        return f"{self.nombre} · {self.comercio.nombre_entidad}"

    # --- Atajos para las plantillas y las reglas ---
    @property
    def dias_restantes(self):
        """Días que quedan hasta la fecha del envase (0 = hoy, negativo = ya pasó)."""
        return (self.fecha - timezone.localdate()).days

    @property
    def franja_terminada(self):
        return timezone.now() >= self.recogida_fin

    @property
    def puede_volver_a_publicarse(self):
        """Regla del proyecto: si la entidad cancela, vuelve a publicarse solo si le queda al menos 1 día."""
        return self.dias_restantes >= 1 and not self.franja_terminada

    @property
    def imagen(self):
        """La foto subida por el comercio o, si no hay, la de Open Food Facts."""
        if self.foto:
            return self.foto.url
        return self.foto_url

    def resumir(self, productos):
        """Rellena el resumen del lote (nombre, kilos, alérgenos…) a partir de sus productos."""
        nombres = [p.nombre for p in productos]
        if not self.nombre:
            if len(nombres) == 1:
                self.nombre = nombres[0]
            elif len(nombres) == 2:
                self.nombre = f"{nombres[0]} y {nombres[1]}"
            else:
                self.nombre = f"{nombres[0]}, {nombres[1]} y {len(nombres) - 2} más"
            self.nombre = self.nombre[:120]
        self.unidades = sum(p.unidades for p in productos)
        self.kg = sum(p.kg for p in productos)
        categorias = {p.categoria for p in productos}
        self.categoria = categorias.pop() if len(categorias) == 1 else self.Categoria.VARIADO
        solo_uno = len(productos) == 1
        self.codigo_barras = productos[0].codigo_barras if solo_uno else ""
        self.marca = productos[0].marca if solo_uno else ""
        self.foto_url = next((p.foto_url for p in productos if p.foto_url), "")
        alergenos = []
        for p in productos:
            for a in p.alergenos.split(","):
                a = a.strip().lower()
                if a and a not in alergenos:
                    alergenos.append(a)
        self.alergenos = ", ".join(alergenos)[:200]


class ProductoLote(models.Model):
    """Un producto dentro de un lote. Por ejemplo: 3 × Yogur natural, 1,5 kg."""

    lote = models.ForeignKey(Lote, on_delete=models.CASCADE, related_name="productos")
    codigo_barras = models.CharField("código de barras", max_length=14, blank=True)
    nombre = models.CharField("producto", max_length=120)
    marca = models.CharField("marca", max_length=80, blank=True)
    categoria = models.CharField("categoría", max_length=20, choices=Lote.Categoria.choices)
    foto_url = models.URLField("foto de Open Food Facts", blank=True)
    alergenos = models.CharField("alérgenos", max_length=200, blank=True)
    unidades = models.PositiveIntegerField("unidades")
    kg = models.DecimalField("peso (kg)", max_digits=6, decimal_places=2)

    class Meta:
        verbose_name = "producto del lote"
        verbose_name_plural = "productos del lote"
        ordering = ["id"]

    def __str__(self):
        return f"{self.unidades} × {self.nombre}"
