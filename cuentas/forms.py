"""Formularios de registro e inicio de sesión."""

from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm

from .models import Usuario


class RegistroForm(UserCreationForm):
    """Formulario para crear una cuenta de comercio o de ONG."""

    class Meta:
        model = Usuario
        fields = ["nombre_entidad", "email", "telefono", "direccion", "registro_oficial"]
        widgets = {
            "nombre_entidad": forms.TextInput(attrs={"autocomplete": "organization"}),
            "email": forms.EmailInput(attrs={"autocomplete": "email"}),
            "telefono": forms.TextInput(attrs={"autocomplete": "tel", "inputmode": "tel"}),
            "direccion": forms.TextInput(attrs={"autocomplete": "street-address"}),
        }

    def __init__(self, *args, rol, **kwargs):
        super().__init__(*args, **kwargs)
        self.rol = rol
        if rol == Usuario.Rol.COMERCIO:
            self.fields["nombre_entidad"].widget.attrs["placeholder"] = "Supermercado Plaza"
            self.fields["direccion"].widget.attrs["placeholder"] = "C/ Carretera de Boadilla, 12"
            # Los comercios no necesitan nº de registro
            del self.fields["registro_oficial"]
        else:
            self.fields["nombre_entidad"].widget.attrs["placeholder"] = "Comedor Social San José"
            self.fields["direccion"].widget.attrs["placeholder"] = "C/ Eras, 5"
            self.fields["registro_oficial"].required = True
            self.fields["registro_oficial"].widget.attrs["placeholder"] = "G-12345678"

    def save(self, commit=True):
        usuario = super().save(commit=False)
        usuario.rol = self.rol
        # Los comercios empiezan a publicar al momento.
        # Las ONG esperan a que un administrador las apruebe.
        if self.rol == Usuario.Rol.COMERCIO:
            usuario.estado = Usuario.Estado.APROBADO
        else:
            usuario.estado = Usuario.Estado.PENDIENTE
        if commit:
            usuario.save()
        return usuario


class LoginForm(AuthenticationForm):
    """Inicio de sesión con email y contraseña."""

    username = forms.EmailField(
        label="Email",
        widget=forms.EmailInput(attrs={"autofocus": True, "autocomplete": "email"}),
    )
    error_messages = {
        "invalid_login": "El email o la contraseña no son correctos.",
        "inactive": "Esta cuenta está desactivada.",
    }
