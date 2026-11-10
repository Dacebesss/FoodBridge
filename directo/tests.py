"""Pruebas de FoodBridge en directo (la simulación de la presentación)."""

import json

from django.test import TestCase
from django.urls import reverse

from .models import Envio


class DirectoTests(TestCase):
    def enviar(self, **datos):
        return self.client.post(reverse("directo:enviar"), json.dumps(datos), content_type="application/json")

    def test_la_pagina_del_movil_carga(self):
        r = self.client.get(reverse("directo:movil"))
        self.assertContains(r, "Enviar al puente")

    def test_enviar_crea_un_envio_con_sus_kilos(self):
        r = self.enviar(producto="yogures", unidades=6)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["texto"], "6 yogures · 0,75 kg")
        self.assertEqual(Envio.objects.count(), 1)

    def test_solo_productos_de_la_lista(self):
        self.assertEqual(self.enviar(producto="<script>", unidades=3).status_code, 400)
        self.assertEqual(self.enviar(producto="pan", unidades=99).status_code, 400)
        self.assertFalse(Envio.objects.exists())

    def test_un_movil_no_puede_enviar_sin_parar(self):
        self.assertEqual(self.enviar(producto="pan", unidades=2).status_code, 200)
        self.assertEqual(self.enviar(producto="pan", unidades=2).status_code, 429)
        self.assertEqual(Envio.objects.count(), 1)

    def test_la_pantalla_recibe_solo_los_nuevos(self):
        self.enviar(producto="pan", unidades=4)
        primero = self.client.get(reverse("directo:estado") + "?desde=-1").json()
        self.assertEqual(primero["envios"], [])
        self.assertEqual(primero["total"]["lotes"], 1)
        Envio.objects.create(producto="fruta", unidades=2, kg=2)
        nuevo = self.client.get(reverse("directo:estado") + f"?desde={primero['ultimo']}").json()
        self.assertEqual(len(nuevo["envios"]), 1)
        self.assertEqual(nuevo["envios"][0]["numero"], 2)
        self.assertEqual(nuevo["total"]["kg"], 3.0)
