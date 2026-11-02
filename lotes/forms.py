"""Formulario para publicar un lote."""

import datetime
import re

from django import forms
from django.utils import timezone

from .models import Lote

# Solo aceptamos fotos que vengan de Open Food Facts (no cualquier enlace de internet).
PREFIJO_FOTOS_OFF = "https://images.openfoodfacts.org/"
TAMANO_MAX_FOTO = 5 * 1024 * 1024  # 5 MB


def digito_de_control_correcto(codigo):
    """
    El último número de un código de barras (EAN/UPC) se calcula con los demás:
    se multiplican alternando por 3 y por 1 empezando por la derecha, y se mira
    cuánto falta para llegar a la siguiente decena.
    """
    cifras = [int(c) for c in codigo]
    suma = sum(c * (3 if i % 2 == 0 else 1) for i, c in enumerate(reversed(cifras[:-1])))
    return (10 - suma % 10) % 10 == cifras[-1]


class LoteForm(forms.ModelForm):
    # La franja de recogida se pide como "día + desde + hasta", que es más fácil de rellenar.
    dia_recogida = forms.DateField(
        label="Día de recogida", widget=forms.DateInput(attrs={"type": "date"})
    )
    hora_desde = forms.TimeField(label="Desde", widget=forms.TimeInput(attrs={"type": "time"}))
    hora_hasta = forms.TimeField(label="Hasta", widget=forms.TimeInput(attrs={"type": "time"}))

    class Meta:
        model = Lote
        fields = [
            "codigo_barras", "nombre", "marca", "categoria", "foto", "foto_url",
            "unidades", "kg", "tipo_fecha", "fecha", "alergenos", "observaciones",
        ]
        widgets = {
            "codigo_barras": forms.HiddenInput(),
            "foto_url": forms.HiddenInput(),
            "nombre": forms.TextInput(attrs={"placeholder": "Yogures naturales"}),
            "marca": forms.TextInput(attrs={"placeholder": "Opcional"}),
            "foto": forms.ClearableFileInput(attrs={"accept": "image/*", "capture": "environment"}),
            "unidades": forms.NumberInput(attrs={"min": 1, "inputmode": "numeric"}),
            "kg": forms.NumberInput(attrs={"min": "0.01", "step": "0.01", "inputmode": "decimal"}),
            "tipo_fecha": forms.RadioSelect,
            "fecha": forms.DateInput(attrs={"type": "date"}, format="%Y-%m-%d"),
            "alergenos": forms.TextInput(attrs={"placeholder": "Leche, gluten… (si se sabe)"}),
            "observaciones": forms.TextInput(attrs={"placeholder": "Mantener en frío"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.is_bound and "dia_recogida" not in self.initial:
            # Por defecto: hoy por la tarde ("publicar, reservar y entregar en la misma tarde").
            self.initial["dia_recogida"] = timezone.localdate().isoformat()
            self.initial["hora_desde"] = "18:00"
            self.initial["hora_hasta"] = "20:00"
        self.fields["categoria"].choices = [("", "Elige una categoría")] + list(
            Lote.Categoria.choices
        )
        # Sin opción vacía "---------": hay que elegir uno de los dos tipos de fecha.
        self.fields["tipo_fecha"].choices = Lote.TipoFecha.choices
        self.fields["unidades"].widget.attrs["min"] = 1

    def clean_unidades(self):
        unidades = self.cleaned_data["unidades"]
        if unidades < 1:
            raise forms.ValidationError("Tiene que haber al menos 1 unidad.")
        return unidades

    def clean_kg(self):
        kg = self.cleaned_data["kg"]
        if kg <= 0:
            raise forms.ValidationError("El peso tiene que ser mayor que 0.")
        return kg

    def clean_codigo_barras(self):
        codigo = self.cleaned_data["codigo_barras"].strip()
        if codigo and not re.fullmatch(r"\d{8,14}", codigo):
            raise forms.ValidationError("El código de barras debe tener entre 8 y 14 números.")
        if codigo and not digito_de_control_correcto(codigo):
            raise forms.ValidationError("El código de barras no es válido (el último número no cuadra).")
        return codigo

    def clean_foto_url(self):
        url = self.cleaned_data["foto_url"]
        if url and not url.startswith(PREFIJO_FOTOS_OFF):
            raise forms.ValidationError("La foto automática solo puede venir de Open Food Facts.")
        return url

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

        # Regla 1: pasada la fecha de caducidad no se puede donar.
        if tipo == Lote.TipoFecha.CADUCIDAD and fecha and fecha < hoy:
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
        lote = super().save(commit=False)
        lote.recogida_inicio = self.cleaned_data["recogida_inicio"]
        lote.recogida_fin = self.cleaned_data["recogida_fin"]
        if commit:
            lote.save()
        return lote
