from django.contrib import admin

from .models import Envio


@admin.register(Envio)
class EnvioAdmin(admin.ModelAdmin):
    list_display = ("id", "comercio", "producto", "unidades", "kg", "creado")
    list_filter = ("producto",)
