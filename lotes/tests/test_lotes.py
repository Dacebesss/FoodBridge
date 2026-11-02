"""
Pruebas de los lotes: publicar, reservar, PIN, cancelar y franjas.

Ejecutar:  python manage.py test
"""

import datetime
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from cuentas.models import Usuario
from lotes import operaciones
from lotes.models import Lote

CLAVE = "UnaClaveSegura-2026"
HOY = timezone.localdate


def crear_usuario(email, rol, estado=Usuario.Estado.APROBADO, municipio="Villaviciosa de Odón"):
    return Usuario.objects.create_user(
        email=email, password=CLAVE, rol=rol, estado=estado,
        nombre_entidad=email.split("@")[0].title(), direccion="C/ Mayor, 1", municipio=municipio,
    )


def crear_lote(comercio, **cambios):
    ahora = timezone.now()
    datos = dict(
        comercio=comercio, nombre="Yogures", categoria=Lote.Categoria.LACTEOS,
        unidades=4, kg=Decimal("2.00"), tipo_fecha=Lote.TipoFecha.CADUCIDAD,
        fecha=HOY() + datetime.timedelta(days=2),
        recogida_inicio=ahora, recogida_fin=ahora + datetime.timedelta(hours=3),
    )
    datos.update(cambios)
    return Lote.objects.create(**datos)


def datos_formulario(**cambios):
    manana = HOY() + datetime.timedelta(days=1)
    datos = {
        "nombre": "Yogures naturales", "categoria": "lacteos", "unidades": "6", "kg": "3",
        "tipo_fecha": "caducidad", "fecha": (manana + datetime.timedelta(days=1)).isoformat(),
        "dia_recogida": manana.isoformat(), "hora_desde": "18:00", "hora_hasta": "20:00",
    }
    datos.update(cambios)
    return datos


class PublicarTests(TestCase):
    def setUp(self):
        self.comercio = crear_usuario("plaza@ejemplo.es", Usuario.Rol.COMERCIO)
        self.client.force_login(self.comercio)

    def test_comercio_publica_un_lote(self):
        r = self.client.post(reverse("lotes:publicar"), datos_formulario(codigo_barras="8410000000000"))
        self.assertRedirects(r, reverse("cuentas:panel"))
        lote = Lote.objects.get()
        self.assertEqual(lote.estado, Lote.Estado.DISPONIBLE)
        self.assertEqual(lote.comercio, self.comercio)
        self.assertEqual(timezone.localtime(lote.recogida_inicio).hour, 18)

    def test_no_se_puede_donar_un_producto_caducado(self):
        ayer = (HOY() - datetime.timedelta(days=1)).isoformat()
        r = self.client.post(reverse("lotes:publicar"), datos_formulario(fecha=ayer))
        self.assertContains(r, "ya ha caducado")
        self.assertFalse(Lote.objects.exists())

    def test_consumo_preferente_pasado_si_se_puede_donar(self):
        ayer = (HOY() - datetime.timedelta(days=1)).isoformat()
        self.client.post(reverse("lotes:publicar"), datos_formulario(tipo_fecha="preferente", fecha=ayer))
        self.assertTrue(Lote.objects.exists())

    def test_la_recogida_no_puede_ser_despues_de_caducar(self):
        r = self.client.post(reverse("lotes:publicar"), datos_formulario(fecha=HOY().isoformat()))
        self.assertContains(r, "como tarde el día que caduca")
        self.assertFalse(Lote.objects.exists())

    def test_foto_automatica_solo_de_open_food_facts(self):
        r = self.client.post(reverse("lotes:publicar"), datos_formulario(foto_url="https://ejemplo.com/foto.jpg"))
        self.assertContains(r, "solo puede venir de Open Food Facts")
        self.client.post(reverse("lotes:publicar"), datos_formulario(
            foto_url="https://images.openfoodfacts.org/images/products/841/foto.jpg"))
        self.assertTrue(Lote.objects.exists())

    def test_una_entidad_no_puede_publicar(self):
        entidad = crear_usuario("comedor@ejemplo.es", Usuario.Rol.ONG)
        self.client.force_login(entidad)
        self.assertEqual(self.client.get(reverse("lotes:publicar")).status_code, 403)


class ReservarTests(TestCase):
    def setUp(self):
        self.comercio = crear_usuario("plaza@ejemplo.es", Usuario.Rol.COMERCIO)
        self.entidad = crear_usuario("comedor@ejemplo.es", Usuario.Rol.ONG)
        self.otra = crear_usuario("despensa@ejemplo.es", Usuario.Rol.ONG)
        self.lote = crear_lote(self.comercio)

    def test_reservar_bloquea_el_lote_y_da_un_pin_de_4_cifras(self):
        lote = operaciones.reservar(self.lote.pk, self.entidad)
        self.assertEqual(lote.estado, Lote.Estado.RESERVADO)
        self.assertEqual(lote.entidad, self.entidad)
        self.assertRegex(lote.pin, r"^\d{4}$")

    def test_el_primero_que_llega_gana(self):
        self.assertIsNotNone(operaciones.reservar(self.lote.pk, self.entidad))
        self.assertIsNone(operaciones.reservar(self.lote.pk, self.otra))
        self.lote.refresh_from_db()
        self.assertEqual(self.lote.entidad, self.entidad)

    def test_entidad_pendiente_no_puede_reservar(self):
        pendiente = crear_usuario("nueva@ejemplo.es", Usuario.Rol.ONG, estado=Usuario.Estado.PENDIENTE)
        self.assertIsNone(operaciones.reservar(self.lote.pk, pendiente))

    def test_entidad_de_otro_municipio_no_lo_ve(self):
        lejos = crear_usuario("lejos@ejemplo.es", Usuario.Rol.ONG, municipio="Móstoles")
        self.assertFalse(operaciones.lotes_visibles_para(lejos).exists())
        self.assertIsNone(operaciones.reservar(self.lote.pk, lejos))

    def test_reservar_desde_el_panel(self):
        self.client.force_login(self.entidad)
        r = self.client.get(reverse("cuentas:panel"))
        self.assertContains(r, "Yogures")
        r = self.client.post(reverse("lotes:reservar", args=[self.lote.pk]), follow=True)
        self.lote.refresh_from_db()
        self.assertContains(r, self.lote.pin)


class EntregarTests(TestCase):
    def setUp(self):
        self.comercio = crear_usuario("plaza@ejemplo.es", Usuario.Rol.COMERCIO)
        self.entidad = crear_usuario("comedor@ejemplo.es", Usuario.Rol.ONG)
        self.lote = operaciones.reservar(crear_lote(self.comercio).pk, self.entidad)
        self.client.force_login(self.comercio)

    def test_pin_correcto_confirma_la_entrega(self):
        self.client.post(reverse("lotes:entregar", args=[self.lote.pk]), {"pin": self.lote.pin})
        self.lote.refresh_from_db()
        self.assertEqual(self.lote.estado, Lote.Estado.ENTREGADO)
        self.assertIsNotNone(self.lote.entregado_en)

    def test_pin_incorrecto_no_entrega(self):
        incorrecto = "0000" if self.lote.pin != "0000" else "1111"
        self.client.post(reverse("lotes:entregar", args=[self.lote.pk]), {"pin": incorrecto})
        self.lote.refresh_from_db()
        self.assertEqual(self.lote.estado, Lote.Estado.RESERVADO)

    def test_cinco_fallos_cambian_el_pin(self):
        pin_viejo = self.lote.pin
        incorrecto = "0000" if pin_viejo != "0000" else "1111"
        for _ in range(operaciones.MAX_INTENTOS_PIN):
            resultado = operaciones.entregar(self.lote, incorrecto)
        self.assertEqual(resultado, "pin_nuevo")
        self.lote.refresh_from_db()
        self.assertEqual(self.lote.estado, Lote.Estado.RESERVADO)
        self.assertEqual(self.lote.intentos_pin, 0)

    def test_otro_comercio_no_puede_validar_el_pin(self):
        otro = crear_usuario("otro@ejemplo.es", Usuario.Rol.COMERCIO)
        self.client.force_login(otro)
        r = self.client.post(reverse("lotes:entregar", args=[self.lote.pk]), {"pin": self.lote.pin})
        self.assertEqual(r.status_code, 404)


class CancelarYFranjasTests(TestCase):
    def setUp(self):
        self.comercio = crear_usuario("plaza@ejemplo.es", Usuario.Rol.COMERCIO)
        self.entidad = crear_usuario("comedor@ejemplo.es", Usuario.Rol.ONG)

    def test_cancelar_con_margen_lo_vuelve_a_publicar(self):
        lote = operaciones.reservar(crear_lote(self.comercio).pk, self.entidad)
        self.assertTrue(operaciones.cancelar(lote))
        lote.refresh_from_db()
        self.assertEqual(lote.estado, Lote.Estado.DISPONIBLE)
        self.assertIsNone(lote.entidad)
        self.assertEqual(lote.pin, "")

    def test_cancelar_sin_un_dia_de_margen_lo_retira(self):
        lote = operaciones.reservar(crear_lote(self.comercio, fecha=HOY()).pk, self.entidad)
        self.assertFalse(operaciones.cancelar(lote))
        lote.refresh_from_db()
        self.assertEqual(lote.estado, Lote.Estado.RETIRADO)

    def test_si_termina_la_franja_la_reserva_se_libera(self):
        lote = operaciones.reservar(crear_lote(self.comercio).pk, self.entidad)
        Lote.objects.filter(pk=lote.pk).update(recogida_fin=timezone.now() - datetime.timedelta(minutes=1))
        self.assertEqual(operaciones.cerrar_franjas_terminadas(), 1)
        lote.refresh_from_db()
        self.assertEqual(lote.estado, Lote.Estado.RETIRADO)
        self.assertEqual(lote.pin, "")

    def test_registro_de_donaciones_en_el_panel_del_comercio(self):
        lote = operaciones.reservar(crear_lote(self.comercio, kg=Decimal("2.50")).pk, self.entidad)
        operaciones.entregar(lote, lote.pin)
        self.client.force_login(self.comercio)
        r = self.client.get(reverse("cuentas:panel"))
        self.assertEqual(r.context["entregas"]["n"], 1)
        self.assertEqual(r.context["entregas"]["kg"], Decimal("2.50"))


class FormularioTests(TestCase):
    def setUp(self):
        self.client.force_login(crear_usuario("plaza@ejemplo.es", Usuario.Rol.COMERCIO))

    def test_hacen_falta_unidades_y_kilos(self):
        r = self.client.post(reverse("lotes:publicar"), datos_formulario(unidades="0", kg="0"))
        self.assertContains(r, "al menos 1 unidad")
        self.assertContains(r, "mayor que 0")
        self.assertFalse(Lote.objects.exists())

    def test_tipo_de_fecha_sin_opcion_vacia(self):
        r = self.client.get(reverse("lotes:publicar"))
        self.assertNotContains(r, "---------")
