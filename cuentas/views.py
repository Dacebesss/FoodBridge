"""
Vistas de la app "cuentas".

Una vista es una función que recibe una petición del navegador
y devuelve una página (normalmente rellenando una plantilla HTML).
"""

from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView
from django.http import Http404
from django.shortcuts import redirect, render

from .forms import LoginForm, RegistroForm
from .models import Usuario


def inicio(request):
    """Página de bienvenida. Si ya has iniciado sesión, te lleva a tu panel."""
    if request.user.is_authenticated:
        return redirect("cuentas:panel")
    return render(request, "inicio.html")


def registro_elegir(request):
    """Primer paso del registro: ¿eres comercio o ONG?"""
    return render(request, "cuentas/registro_elegir.html")


def registro(request, rol):
    """Segundo paso: rellenar los datos según el rol elegido."""
    if rol not in (Usuario.Rol.COMERCIO, Usuario.Rol.ONG):
        raise Http404

    if request.method == "POST":
        form = RegistroForm(request.POST, rol=rol)
        if form.is_valid():
            usuario = form.save()
            login(request, usuario)
            if usuario.es_ong:
                messages.info(request, "Cuenta creada. La revisaremos pronto.")
            else:
                messages.success(request, "Cuenta creada. Ya puedes publicar excedente.")
            return redirect("cuentas:panel")
    else:
        form = RegistroForm(rol=rol)

    return render(request, "cuentas/registro.html", {"form": form, "rol": rol})


class EntrarView(LoginView):
    template_name = "cuentas/login.html"
    authentication_form = LoginForm
    redirect_authenticated_user = True


@login_required
def panel(request):
    """Cada rol ve su propio panel."""
    usuario = request.user

    if usuario.es_admin:
        contexto = {
            "ong_pendientes": Usuario.objects.filter(
                rol=Usuario.Rol.ONG, estado=Usuario.Estado.PENDIENTE
            ).order_by("date_joined"),
            "num_comercios": Usuario.objects.filter(rol=Usuario.Rol.COMERCIO).count(),
            "num_ong": Usuario.objects.filter(
                rol=Usuario.Rol.ONG, estado=Usuario.Estado.APROBADO
            ).count(),
        }
        return render(request, "cuentas/panel_admin.html", contexto)

    if usuario.es_comercio:
        return render(request, "cuentas/panel_comercio.html")

    return render(request, "cuentas/panel_ong.html")
