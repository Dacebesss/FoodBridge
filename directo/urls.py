"""Direcciones de FoodBridge en directo."""

from django.urls import path

from . import views

app_name = "directo"

urlpatterns = [
    path("", views.movil, name="movil"),
    path("enviar/", views.enviar, name="enviar"),
    path("estado/", views.estado, name="estado"),
]
