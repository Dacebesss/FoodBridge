"""Direcciones (URLs) de la app "cuentas"."""

from django.contrib.auth.views import LogoutView
from django.urls import path

from . import views

app_name = "cuentas"

urlpatterns = [
    path("entrar/", views.EntrarView.as_view(), name="login"),
    path("salir/", LogoutView.as_view(), name="logout"),
    path("registro/", views.registro_elegir, name="registro_elegir"),
    path("registro/<str:rol>/", views.registro, name="registro"),
    path("panel/", views.panel, name="panel"),
]
