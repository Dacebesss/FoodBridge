"""Los lotes también se pueden ver y revisar desde el panel de administración (/admin)."""

from django.contrib import admin

from .models import Lote, ProductoLote


class ProductoEnLinea(admin.TabularInline):
    model = ProductoLote
    extra = 0


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ("nombre", "comercio", "unidades", "kg", "tipo_fecha", "fecha", "recogida_fin", "estado", "entidad")
    list_filter = ("estado", "categoria", "tipo_fecha", "comercio__municipio")
    search_fields = ("nombre", "marca", "codigo_barras", "comercio__nombre_entidad", "entidad__nombre_entidad")
    date_hierarchy = "recogida_inicio"
    readonly_fields = ("pin", "creado_en", "reservado_en", "entregado_en")
    inlines = [ProductoEnLinea]
