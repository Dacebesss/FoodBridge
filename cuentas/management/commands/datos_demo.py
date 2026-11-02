"""
Crea cuentas de ejemplo para probar la app y para la demo de la presentación.

Uso:  python manage.py datos_demo
"""

from django.core.management.base import BaseCommand

from cuentas.models import Usuario

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


class Command(BaseCommand):
    help = "Crea cuentas de ejemplo (contraseña: foodbridge2026)"

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

        self.stdout.write(f"\nContraseña de todas las cuentas: {CONTRASENA}")
