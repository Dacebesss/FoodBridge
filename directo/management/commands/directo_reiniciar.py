"""
Pone el contador de FoodBridge en directo a cero (antes de cada presentación).

Uso:  python manage.py directo_reiniciar
"""

from django.core.management.base import BaseCommand

from directo.models import Envio


class Command(BaseCommand):
    help = "Borra los envíos de FoodBridge en directo y pone el contador a cero."

    def handle(self, *args, **options):
        n, _ = Envio.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f"Contador a cero ({n} envíos borrados)."))
