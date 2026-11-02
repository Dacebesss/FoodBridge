"""
Crea cuentas de ejemplo para probar la app y para la demo de la presentación.

Uso:  python manage.py datos_demo
      python manage.py datos_demo --lotes-nuevos   (borra los lotes y crea otros para hoy)

Los comercios y entidades son INVENTADOS: no usamos nombres reales hasta que acepten participar.
"""

import datetime
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from cuentas.models import Usuario
from lotes import operaciones
from lotes.models import Lote, ProductoLote

CONTRASENA = "foodbridge2026"

CUENTAS = [
    # email, rol, estado, nombre, dirección, registro
    ("admin@foodbridge.es", Usuario.Rol.ADMIN, Usuario.Estado.APROBADO,
     "Equipo FoodBridge", "Universidad Europea de Madrid", ""),
    ("plaza@foodbridge.es", Usuario.Rol.COMERCIO, Usuario.Estado.APROBADO,
     "Supermercado Plaza", "C/ Carretera de Boadilla, 12", ""),
    ("espiga@foodbridge.es", Usuario.Rol.COMERCIO, Usuario.Estado.APROBADO,
     "Panadería La Espiga", "C/ Cueva, 3", ""),
    ("sanjose@foodbridge.es", Usuario.Rol.ONG, Usuario.Estado.APROBADO,
     "Comedor Social San José", "C/ Eras, 5", "G-28000001"),
    ("despensa@foodbridge.es", Usuario.Rol.ONG, Usuario.Estado.PENDIENTE,
     "Despensa Solidaria El Bosque", "Av. del Bosque, 20", "G-28000002"),
]


C = Lote.Categoria
F = Lote.TipoFecha
# (nombre del lote, tipo de fecha, días hasta la fecha, comercio, [(producto, categoría, unidades, kg)])
LOTES = [
    ("", F.CADUCIDAD, 1, "plaza@foodbridge.es",
     [("Yogures naturales (pack de 4)", C.LACTEOS, 6, "3.00")]),
    ("", F.CADUCIDAD, 0, "plaza@foodbridge.es",
     [("Ensalada mixta preparada", C.PLATOS, 8, "2.00")]),
    ("Caja de excedentes del día", F.PREFERENTE, 2, "plaza@foodbridge.es",
     [("Galletas María", C.DESPENSA, 4, "3.20"), ("Leche semidesnatada 1 L", C.LACTEOS, 6, "6.00"),
      ("Tomate frito", C.DESPENSA, 3, "1.20"), ("Plátanos", C.FRUTA_VERDURA, 1, "1.50")]),
    ("", F.FRESCO, 0, "espiga@foodbridge.es",
     [("Barras de pan del día", C.PAN_BOLLERIA, 15, "3.75")]),
    ("", F.PREFERENTE, 2, "espiga@foodbridge.es",
     [("Magdalenas caseras", C.PAN_BOLLERIA, 24, "1.20")]),
]


def crear_lote(comercio, nombre, tipo, fecha, inicio, fin, productos, **extra):
    """Crea un lote con sus productos, igual que lo haría la página de publicar."""
    lista = [ProductoLote(nombre=n, categoria=c, unidades=u, kg=Decimal(kg)) for n, c, u, kg in productos]
    lote = Lote(comercio=comercio, nombre=nombre, tipo_fecha=tipo, fecha=fecha,
                recogida_inicio=inicio, recogida_fin=fin, **extra)
    lote.resumir(lista)
    lote.save()
    for producto in lista:
        producto.lote = lote
    ProductoLote.objects.bulk_create(lista)
    return lote


def franja_de_hoy():
    """Franja de recogida de esta tarde (o de mañana si ya es muy tarde)."""
    zona = timezone.get_current_timezone()
    ahora = timezone.localtime()
    dia = ahora.date() if ahora.hour < 19 else ahora.date() + datetime.timedelta(days=1)
    inicio = max(ahora, timezone.make_aware(datetime.datetime.combine(dia, datetime.time(18)), zona))
    fin = timezone.make_aware(datetime.datetime.combine(dia, datetime.time(21)), zona)
    return dia, inicio, fin


class Command(BaseCommand):
    help = "Crea cuentas y lotes de ejemplo (contraseña: foodbridge2026)"

    def add_arguments(self, parser):
        parser.add_argument("--lotes-nuevos", action="store_true",
                            help="Borra todos los lotes y crea los de ejemplo para hoy.")

    def handle(self, *args, **options):
        for email, rol, estado, nombre, direccion, registro in CUENTAS:
            if Usuario.objects.filter(email=email).exists():
                self.stdout.write(f"  ya existe  {email}")
                continue
            es_admin = rol == Usuario.Rol.ADMIN
            Usuario.objects.create_user(
                email=email,
                password=CONTRASENA,
                rol=rol,
                estado=estado,
                nombre_entidad=nombre,
                direccion=direccion,
                registro_oficial=registro,
                is_staff=es_admin,
                is_superuser=es_admin,
            )
            self.stdout.write(self.style.SUCCESS(f"  creada     {email}"))

        self.crear_lotes(options["lotes_nuevos"])
        self.stdout.write(f"\nContraseña de todas las cuentas: {CONTRASENA}")

    def crear_lotes(self, borrar):
        if borrar:
            Lote.objects.all().delete()
        elif Lote.objects.exists():
            self.stdout.write("  ya hay lotes (usa --lotes-nuevos para crearlos otra vez)")
            return

        dia, inicio, fin = franja_de_hoy()
        hoy = timezone.localdate()
        creados = []
        for nombre, tipo, dias, email, productos in LOTES:
            fecha = hoy + datetime.timedelta(days=dias)
            if tipo != F.PREFERENTE:
                fecha = max(dia, fecha)  # que se pueda recoger antes de la fecha
            creados.append(crear_lote(Usuario.objects.get(email=email), nombre, tipo, fecha, inicio, fin, productos))

        # Una reserva ya hecha y una entrega de ayer, para enseñar todo el recorrido en la demo.
        comedor = Usuario.objects.get(email="sanjose@foodbridge.es")
        operaciones.reservar(creados[0].pk, comedor)
        ayer = timezone.now() - datetime.timedelta(days=1)
        crear_lote(
            Usuario.objects.get(email="espiga@foodbridge.es"), "", F.FRESCO, ayer.date(),
            ayer, ayer + datetime.timedelta(hours=2), [("Croissants", C.PAN_BOLLERIA, 20, "1.40")],
            estado=Lote.Estado.ENTREGADO, entidad=comedor, entregado_en=ayer + datetime.timedelta(hours=1),
        )
        self.stdout.write(self.style.SUCCESS(f"  creados   {len(creados) + 1} lotes (1 reservado y 1 entregado)"))
