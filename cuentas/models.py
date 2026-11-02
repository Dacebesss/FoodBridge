"""
Modelos de la app "cuentas".

Un modelo es una tabla de la base de datos escrita como una clase de Python.
Cada atributo de la clase es una columna de la tabla.
"""

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class GestorUsuarios(BaseUserManager):
    """Crea usuarios usando el email en lugar de un nombre de usuario."""

    use_in_migrations = True

    def _crear(self, email, password, **campos):
        if not email:
            raise ValueError("El email es obligatorio")
        email = self.normalize_email(email)
        usuario = self.model(email=email, **campos)
        usuario.set_password(password)  # guarda la contraseña cifrada, nunca en texto
        usuario.save(using=self._db)
        return usuario

    def create_user(self, email, password=None, **campos):
        campos.setdefault("is_staff", False)
        campos.setdefault("is_superuser", False)
        return self._crear(email, password, **campos)

    def create_superuser(self, email, password=None, **campos):
        campos.setdefault("is_staff", True)
        campos.setdefault("is_superuser", True)
        campos.setdefault("rol", Usuario.Rol.ADMIN)
        campos.setdefault("estado", Usuario.Estado.APROBADO)
        return self._crear(email, password, **campos)


class Usuario(AbstractUser):
    """
    Una cuenta de FoodBridge. Puede ser un comercio, una ONG o un administrador.
    """

    class Rol(models.TextChoices):
        COMERCIO = "comercio", "Comercio"
        ONG = "ong", "ONG o comedor social"
        ADMIN = "admin", "Administrador"

    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente de revisión"
        APROBADO = "aprobado", "Aprobado"
        RECHAZADO = "rechazado", "Rechazado"

    # Quitamos el "username" de Django: se entra con el email.
    username = None
    email = models.EmailField("email", unique=True)

    rol = models.CharField("rol", max_length=10, choices=Rol.choices)
    estado = models.CharField(
        "estado",
        max_length=10,
        choices=Estado.choices,
        default=Estado.PENDIENTE,
        help_text="Las ONG necesitan estar aprobadas para poder reservar.",
    )

    # Datos de la entidad (el supermercado, la panadería, el comedor social...)
    nombre_entidad = models.CharField("nombre de la entidad", max_length=120)
    telefono = models.CharField("teléfono", max_length=20, blank=True)
    direccion = models.CharField("dirección", max_length=200)
    # Guardamos el municipio desde el principio para poder crecer a otras zonas.
    municipio = models.CharField("municipio", max_length=80, default="Villaviciosa de Odón")
    registro_oficial = models.CharField(
        "nº de registro o CIF",
        max_length=40,
        blank=True,
        help_text="Para las ONG: nº del registro de asociaciones o CIF. Sirve para verificarlas.",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = GestorUsuarios()

    class Meta:
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"

    def __str__(self):
        return f"{self.nombre_entidad or self.email} ({self.get_rol_display()})"

    # --- Atajos que usaremos en las plantillas y las vistas ---
    @property
    def es_comercio(self):
        return self.rol == self.Rol.COMERCIO

    @property
    def es_ong(self):
        return self.rol == self.Rol.ONG

    @property
    def es_admin(self):
        return self.rol == self.Rol.ADMIN or self.is_superuser

    @property
    def puede_reservar(self):
        """Solo las ONG aprobadas pueden reservar comida."""
        return self.es_ong and self.estado == self.Estado.APROBADO
