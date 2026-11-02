"""Direcciones (URLs) de la app "lotes"."""

from django.urls import path

from . import views

app_name = "lotes"

urlpatterns = [
    path("publicar/", views.publicar, name="publicar"),
    path("<int:pk>/reservar/", views.reservar, name="reservar"),
    path("<int:pk>/cancelar/", views.cancelar, name="cancelar"),
    path("<int:pk>/entregar/", views.entregar, name="entregar"),
    path("<int:pk>/retirar/", views.retirar, name="retirar"),
]
