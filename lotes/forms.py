"""
Formulario para publicar un lote (un producto o una caja con varios).

La lista de productos la va llenando el escáner en el navegador y llega aquí
como texto JSON en el campo oculto "productos". Aquí se vuelve a comprobar todo:
nunca nos fiamos de lo que manda el navegador.
"""

import datetime
import json
import re
from decimal import Decimal, InvalidOperation

from django import forms
from django.utils import timezone

from .models import Lote, ProductoLote

# Solo aceptamos fotos que vengan de Open Food Facts (no cualquier enlace de internet).
PREFIJO_FOTOS_OFF = "https://images.openfoodfacts.org/"
TAMANO_MAX_FOTO = 5 * 1024 * 1024  # 5 MB
MAX_PRODUCTOS = 100


def digito_de_control_correcto(codigo):
    """
    El último número de un código de barras (EAN/UPC) se calcula con los demás:
    se multiplican alternando por 3 y por 1 empezando por la derecha, y se mira
    cuánto falta para llegar a la siguiente decena.
    """
    cifras = [int(c) for c in codigo]
    suma = sum(c * (3 if i % 2 == 0 else 1) for i, c in enumerate(reversed(cifras[:-1])))
    return (10 - suma % 10) % 10 == cifras[-1]


def limpiar_producto(datos, n):
    """Comprueba un producto de la lista. Devuelve un ProductoLote sin guardar o lanza un error."""
    if not isinstance(datos, dict):
        raise forms.ValidationError(f"El producto {n} no es válido.")
    texto = lambda clave, largo: str(datos.get(clave) or "").strip()[:largo]

    nombre = texto("nombre", 120)
    if not nombre:
        raise forms.ValidationError(f"Al producto {n} le falta el nombre.")
    codigo = texto("codigo_barras", 14)
    if codigo and not (re.fullmatch(r"\d{8,14}", codigo) and digito_de_control_correcto(codigo)):
        raise forms.ValidationError(f"El código de barras de «{nombre}» no es válido.")
    categoria = texto("categoria", 20) or Lote.Categoria.OTROS
    if categoria not in Lote.Categoria.values or categoria == Lote.Categoria.VARIADO:
        raise forms.ValidationError(f"La categoría de «{nombre}» no es válida.")
    foto_url = texto("foto_url", 300)
    if foto_url and not foto_url.startswith(PREFIJO_FOTOS_OFF):
        raise forms.ValidationError("La foto automática solo puede venir de Open Food Facts.")
    try:
        unidades = int(datos.get("unidades"))
    except (TypeError, ValueError):
        unidades = 0
    if not 1 <= unidades <= 999:
        raise forms.ValidationError(f"«{nombre}» tiene que tener al menos 1 unidad.")
    try:
        kg = Decimal(str(datos.get("kg")).replace(",", ".")).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        kg = Decimal(0)
    if not Decimal("0.01") <= kg <= Decimal("999.99"):
        raise forms.ValidationError(f"Indica el peso de «{nombre}» (mayor que 0).")

    return ProductoLote(
        nombre=nombre, codigo_barras=codigo, marca=texto("marca", 80), categoria=categoria,
        foto_url=foto_url, alergenos=texto("alergenos", 200), unidades=unidades, kg=kg,
    )


class LoteForm(forms.ModelForm):
    productos = forms.CharField(widget=forms.HiddenInput, required=False)
    # La franja de recogida se pide como "día + desde + hasta", que es más fácil de rellenar.
    dia_recogida = forms.DateField(
        label="Día", widget=forms.DateInput(attrs={"type": "date"})
    )
    hora_desde = forms.TimeField(label="Desde", widget=forms.TimeInput(attrs={"type": "time"}))
    hora_hasta = forms.TimeField(label="Hasta", widget=forms.TimeInput(attrs={"type": "time"}))

    class Meta:
        model = Lote
        fields = ["nombre", "foto", "tipo_fecha", "fecha", "observaciones"]
        labels = {
            "nombre": "Nombre del lote (opcional)",
            "foto": "Foto (opcional)",
            "fecha": "Fecha",
        }
        widgets = {
            "nombre": forms.TextInput(attrs={"placeholder": "Se pone solo con los productos"}),
            "foto": forms.ClearableFileInput(attrs={"accept": "image/*"}),
            "tipo_fecha": forms.RadioSelect,
            "fecha": forms.DateInput(attrs={"type": "date"}, format="%Y-%m-%d"),
            "observaciones": forms.TextInput(attrs={"placeholder": "Traer cajas, mantener en frío…"}),
        }

    def __init__(self, *args, franja_habitual=None, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.is_bound:
            # Por defecto: hoy, en la franja que esta tienda usó la última vez (o de 18:00 a 20:00).
            desde, hasta = franja_habitual or ("18:00", "20:00")
            self.initial.setdefault("dia_recogida", timezone.localdate().isoformat())
            self.initial.setdefault("hora_desde", desde)
            self.initial.setdefault("hora_hasta", hasta)
        self.fields["nombre"].required = False
        self.fields["fecha"].required = False  # los frescos no tienen fecha
        # Sin opción vacía "---------"; primero la más habitual en los envases.
        T = Lote.TipoFecha
        self.fields["tipo_fecha"].choices = [(t.value, t.label) for t in (T.PREFERENTE, T.CADUCIDAD, T.FRESCO)]
        self.productos_limpios = []

    def clean_productos(self):
        texto = self.cleaned_data.get("productos") or "[]"
        try:
            lista = json.loads(texto)
        except json.JSONDecodeError:
            raise forms.ValidationError("No hemos podido leer la lista de productos. Vuelve a intentarlo.")
        if not isinstance(lista, list) or not lista:
            raise forms.ValidationError("Añade al menos un producto: escanéalo o usa los botones rápidos.")
        if len(lista) > MAX_PRODUCTOS:
            raise forms.ValidationError(f"Como máximo {MAX_PRODUCTOS} productos por lote.")
        self.productos_limpios = [limpiar_producto(p, n) for n, p in enumerate(lista, start=1)]
        return texto

    def clean_foto(self):
        foto = self.cleaned_data.get("foto")
        if foto and getattr(foto, "size", 0) > TAMANO_MAX_FOTO:
            raise forms.ValidationError("La foto pesa demasiado (máximo 5 MB).")
        return foto

    def clean(self):
        datos = super().clean()
        hoy = timezone.localdate()
        tipo, fecha = datos.get("tipo_fecha"), datos.get("fecha")
        dia, desde, hasta = datos.get("dia_recogida"), datos.get("hora_desde"), datos.get("hora_hasta")

        if tipo == Lote.TipoFecha.FRESCO:
            # Sin fecha en el envase: cuenta como fecha el día de recogida.
            datos["fecha"] = fecha = dia
        elif tipo and not fecha:
            self.add_error("fecha", "Pon la fecha que aparece en el envase.")
        # Regla 1: pasada la fecha de caducidad no se puede donar.
        elif tipo == Lote.TipoFecha.CADUCIDAD and fecha < hoy:
            self.add_error("fecha", "Este producto ya ha caducado: no se puede donar.")

        if dia and desde and hasta:
            if hasta <= desde:
                self.add_error("hora_hasta", "La hora final tiene que ser posterior a la inicial.")
            else:
                zona = timezone.get_current_timezone()
                inicio = timezone.make_aware(datetime.datetime.combine(dia, desde), zona)
                fin = timezone.make_aware(datetime.datetime.combine(dia, hasta), zona)
                if fin <= timezone.now():
                    self.add_error("hora_hasta", "Esa franja ya ha pasado. Elige una hora futura.")
                # Regla 2: hay que poder recogerlo antes de que caduque.
                elif tipo == Lote.TipoFecha.CADUCIDAD and fecha and dia > fecha:
                    self.add_error("dia_recogida", "La recogida tiene que ser como tarde el día que caduca.")
                else:
                    datos["recogida_inicio"], datos["recogida_fin"] = inicio, fin
        return datos

    def save(self, commit=True):
        """Guarda el lote y sus productos. Llamar dentro de transaction.atomic()."""
        lote = super().save(commit=False)
        lote.fecha = self.cleaned_data["fecha"]
        lote.recogida_inicio = self.cleaned_data["recogida_inicio"]
        lote.recogida_fin = self.cleaned_data["recogida_fin"]
        lote.resumir(self.productos_limpios)
        if commit:
            lote.save()
            self.guardar_productos(lote)
        return lote

    def guardar_productos(self, lote):
        for producto in self.productos_limpios:
            producto.lote = lote
        ProductoLote.objects.bulk_create(self.productos_limpios)


def productos_a_json(lote):
    """Convierte los productos de un lote en el texto JSON que entiende la página (para «Publicar de nuevo»)."""
    return json.dumps([
        {"codigo_barras": p.codigo_barras, "nombre": p.nombre, "marca": p.marca,
         "categoria": p.categoria, "foto_url": p.foto_url, "alergenos": p.alergenos,
         "unidades": p.unidades, "kg": str(p.kg)}
        for p in lote.productos.all()
    ], ensure_ascii=False)
