"""
Pruebas de los lotes: publicar, reservar, PIN, cancelar y franjas.

Ejecutar:  python manage.py test
"""

import datetime
import json
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from cuentas.models import Usuario
from lotes import operaciones
from lotes.models import Lote, ProductoLote

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


YOGUR = {"nombre": "Yogures naturales", "categoria": "lacteos", "unidades": 6, "kg": "3"}
PAN = {"nombre": "Pan", "categoria": "pan_bolleria", "unidades": 10, "kg": "2.5"}


def datos_formulario(productos=None, **cambios):
    """Lo que manda la página al pulsar «Publicar lote». La lista de productos va en JSON."""
    manana = HOY() + datetime.timedelta(days=1)
    datos = {
        "productos": json.dumps(productos if productos is not None else [YOGUR]),
        "tipo_fecha": "caducidad", "fecha": (manana + datetime.timedelta(days=1)).isoformat(),
        "dia_recogida": manana.isoformat(), "hora_desde": "18:00", "hora_hasta": "20:00",
    }
    datos.update(cambios)
    return datos


class PublicarTests(TestCase):
    def setUp(self):
        self.comercio = crear_usuario("plaza@ejemplo.es", Usuario.Rol.COMERCIO)
        self.client.force_login(self.comercio)

    def publicar(self, *args, **kwargs):
        return self.client.post(reverse("lotes:publicar"), datos_formulario(*args, **kwargs))

    def test_comercio_publica_un_producto(self):
        r = self.publicar([dict(YOGUR, codigo_barras="3017624010701")])
        self.assertRedirects(r, reverse("cuentas:panel"))
        lote = Lote.objects.get()
        self.assertEqual(lote.estado, Lote.Estado.DISPONIBLE)
        self.assertEqual(lote.comercio, self.comercio)
        self.assertEqual(lote.nombre, "Yogures naturales")
        self.assertEqual(lote.categoria, "lacteos")
        self.assertEqual(lote.codigo_barras, "3017624010701")
        self.assertEqual(timezone.localtime(lote.recogida_inicio).hour, 18)

    def test_comercio_publica_una_caja_con_varios_productos(self):
        self.publicar([YOGUR, PAN, dict(PAN, nombre="Fruta variada", categoria="fruta_verdura", kg="1")])
        lote = Lote.objects.get()
        self.assertEqual(lote.productos.count(), 3)
        self.assertEqual(lote.unidades, 6 + 10 + 10)
        self.assertEqual(lote.kg, Decimal("6.50"))
        self.assertEqual(lote.categoria, Lote.Categoria.VARIADO)
        self.assertEqual(lote.nombre, "Yogures naturales, Pan y 1 más")

    def test_el_nombre_del_lote_se_puede_escribir(self):
        self.publicar([YOGUR, PAN], nombre="Caja del martes")
        self.assertEqual(Lote.objects.get().nombre, "Caja del martes")

    def test_hace_falta_al_menos_un_producto(self):
        r = self.publicar([])
        self.assertContains(r, "Añade al menos un producto")
        self.assertFalse(Lote.objects.exists())

    def test_cada_producto_necesita_nombre_unidades_y_peso(self):
        for malo, mensaje in [
            (dict(YOGUR, nombre=""), "le falta el nombre"),
            (dict(YOGUR, unidades=0), "al menos 1 unidad"),
            (dict(YOGUR, kg="0"), "Indica el peso"),
            (dict(YOGUR, categoria="inventada"), "categoría"),
        ]:
            self.assertContains(self.publicar([malo]), mensaje)
        self.assertFalse(Lote.objects.exists())
        self.assertFalse(ProductoLote.objects.exists())

    def test_lista_de_productos_estropeada(self):
        r = self.client.post(reverse("lotes:publicar"), dict(datos_formulario(), productos="esto no es JSON"))
        self.assertContains(r, "No hemos podido leer la lista")

    def test_no_se_puede_donar_un_producto_caducado(self):
        r = self.publicar(fecha=(HOY() - datetime.timedelta(days=1)).isoformat())
        self.assertContains(r, "ya ha caducado")
        self.assertFalse(Lote.objects.exists())

    def test_consumo_preferente_pasado_si_se_puede_donar(self):
        self.publicar(tipo_fecha="preferente", fecha=(HOY() - datetime.timedelta(days=1)).isoformat())
        self.assertTrue(Lote.objects.exists())

    def test_fresco_sin_fecha_usa_el_dia_de_recogida(self):
        manana = HOY() + datetime.timedelta(days=1)
        self.publicar([PAN], tipo_fecha="fresco", fecha="")
        lote = Lote.objects.get()
        self.assertEqual(lote.fecha, manana)
        self.assertEqual(lote.tipo_fecha, Lote.TipoFecha.FRESCO)

    def test_hay_que_poner_la_fecha_si_no_es_fresco(self):
        r = self.publicar(tipo_fecha="preferente", fecha="")
        self.assertContains(r, "Pon la fecha que aparece en el envase")

    def test_la_recogida_no_puede_ser_despues_de_caducar(self):
        r = self.publicar(fecha=HOY().isoformat())
        self.assertContains(r, "como tarde el día que caduca")
        self.assertFalse(Lote.objects.exists())

    def test_foto_automatica_solo_de_open_food_facts(self):
        r = self.publicar([dict(YOGUR, foto_url="https://ejemplo.com/foto.jpg")])
        self.assertContains(r, "solo puede venir de Open Food Facts")
        self.publicar([dict(YOGUR, foto_url="https://images.openfoodfacts.org/images/products/841/foto.jpg")])
        self.assertTrue(Lote.objects.get().foto_url.startswith("https://images.openfoodfacts.org/"))

    def test_codigo_de_barras_con_digito_de_control_erroneo(self):
        # 3017624010701 es correcto; cambiando el último número deja de cuadrar.
        r = self.publicar([dict(YOGUR, codigo_barras="3017624010702")])
        self.assertContains(r, "no es válido")
        self.assertFalse(Lote.objects.exists())

    def test_alergenos_de_todos_los_productos_sin_repetir(self):
        self.publicar([dict(YOGUR, alergenos="leche"), dict(PAN, alergenos="gluten, leche")])
        self.assertEqual(Lote.objects.get().alergenos, "leche, gluten")

    def test_recuerda_la_franja_habitual_de_la_tienda(self):
        self.publicar(hora_desde="20:30", hora_hasta="21:15")
        r = self.client.get(reverse("lotes:publicar"))
        self.assertContains(r, 'value="20:30"')
        self.assertContains(r, 'value="21:15"')

    def test_publicar_de_nuevo_copia_los_productos(self):
        self.publicar([YOGUR, PAN])
        lote = Lote.objects.get()
        r = self.client.get(reverse("lotes:publicar") + f"?copiar={lote.pk}")
        self.assertContains(r, "Yogures naturales")
        self.assertContains(r, "pan_bolleria")

    def test_tipo_de_fecha_sin_opcion_vacia(self):
        self.assertNotContains(self.client.get(reverse("lotes:publicar")), "---------")

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
