"""
Pruebas automáticas. Comprueban que lo importante funciona.

Ejecutar:  python manage.py test
"""

from django.test import TestCase
from django.urls import reverse

from .models import Usuario


def datos_registro(**extra):
    datos = {
        "nombre_entidad": "Entidad de prueba",
        "email": "prueba@ejemplo.es",
        "telefono": "600000000",
        "direccion": "C/ Mayor, 1",
        "password1": "UnaClaveSegura-2026",
        "password2": "UnaClaveSegura-2026",
    }
    datos.update(extra)
    return datos


class RegistroTests(TestCase):
    def test_comercio_queda_aprobado_al_registrarse(self):
        self.client.post(reverse("cuentas:registro", args=["comercio"]), datos_registro())
        usuario = Usuario.objects.get(email="prueba@ejemplo.es")
        self.assertEqual(usuario.rol, Usuario.Rol.COMERCIO)
        self.assertEqual(usuario.estado, Usuario.Estado.APROBADO)

    def test_ong_queda_pendiente_y_no_puede_reservar(self):
        self.client.post(
            reverse("cuentas:registro", args=["ong"]),
            datos_registro(registro_oficial="G-12345678"),
        )
        usuario = Usuario.objects.get(email="prueba@ejemplo.es")
        self.assertEqual(usuario.estado, Usuario.Estado.PENDIENTE)
        self.assertFalse(usuario.puede_reservar)

    def test_ong_necesita_numero_de_registro(self):
        respuesta = self.client.post(reverse("cuentas:registro", args=["ong"]), datos_registro())
        self.assertEqual(respuesta.status_code, 200)  # vuelve a mostrar el formulario
        self.assertFalse(Usuario.objects.exists())

    def test_no_se_puede_registrar_como_admin(self):
        respuesta = self.client.get(reverse("cuentas:registro", args=["admin"]))
        self.assertEqual(respuesta.status_code, 404)

    def test_ong_aprobada_puede_reservar(self):
        ong = Usuario.objects.create_user(
            email="ong@ejemplo.es", password="x", rol=Usuario.Rol.ONG,
            estado=Usuario.Estado.APROBADO, nombre_entidad="ONG", direccion="C/ 1",
        )
        self.assertTrue(ong.puede_reservar)


class PanelTests(TestCase):
    def test_panel_pide_iniciar_sesion(self):
        respuesta = self.client.get(reverse("cuentas:panel"))
        self.assertRedirects(respuesta, reverse("cuentas:login") + "?next=" + reverse("cuentas:panel"))

    def test_login_con_email(self):
        Usuario.objects.create_user(
            email="plaza@ejemplo.es", password="UnaClaveSegura-2026", rol=Usuario.Rol.COMERCIO,
            estado=Usuario.Estado.APROBADO, nombre_entidad="Supermercado Plaza", direccion="C/ 1",
        )
        respuesta = self.client.post(
            reverse("cuentas:login"),
            {"username": "plaza@ejemplo.es", "password": "UnaClaveSegura-2026"},
            follow=True,
        )
        self.assertContains(respuesta, "Hola, Supermercado Plaza")
