"""
Direcciones (URLs) principales de FoodBridge.

Cada línea une una dirección del navegador con la vista que la responde.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from cuentas.views import inicio

admin.site.site_header = "FoodBridge · Administración"
admin.site.site_title = "FoodBridge"
admin.site.index_title = "Panel de administración"

urlpatterns = [
    path("", inicio, name="inicio"),
    path("cuentas/", include("cuentas.urls")),
    path("lotes/", include("lotes.urls")),
    path("directo/", include("directo.urls")),
    path("admin/", admin.site.urls),
]

# En el ordenador de desarrollo, Django sirve también las fotos subidas.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
