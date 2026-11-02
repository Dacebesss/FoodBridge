"""
Configuración del panel de administrador de Django (/admin).

Desde aquí el equipo FoodBridge puede ver todos los usuarios
y aprobar o rechazar ONG con un par de clics.
"""

from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin

from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ("nombre_entidad", "email", "rol", "estado", "municipio", "date_joined")
    list_filter = ("rol", "estado", "municipio")
    search_fields = ("nombre_entidad", "email", "registro_oficial")
    ordering = ("-date_joined",)
    actions = ["aprobar", "rechazar"]

    fieldsets = (
        ("Acceso", {"fields": ("email", "password")}),
        ("Entidad", {"fields": ("rol", "estado", "nombre_entidad", "registro_oficial")}),
        ("Contacto", {"fields": ("telefono", "direccion", "municipio")}),
        ("Permisos", {"fields": ("is_active", "is_staff", "is_superuser"), "classes": ("collapse",)}),
        ("Fechas", {"fields": ("last_login", "date_joined"), "classes": ("collapse",)}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "rol", "nombre_entidad", "direccion", "password1", "password2"),
        }),
    )

    @admin.action(description="Aprobar las cuentas seleccionadas")
    def aprobar(self, request, queryset):
        n = queryset.update(estado=Usuario.Estado.APROBADO)
        self.message_user(request, f"{n} cuenta(s) aprobada(s).", messages.SUCCESS)

    @admin.action(description="Rechazar las cuentas seleccionadas")
    def rechazar(self, request, queryset):
        n = queryset.update(estado=Usuario.Estado.RECHAZADO)
        self.message_user(request, f"{n} cuenta(s) rechazada(s).", messages.WARNING)
