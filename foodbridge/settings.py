"""
Configuración del proyecto FoodBridge.

Aquí se decide qué apps usa el proyecto, qué base de datos, el idioma,
dónde están las plantillas (HTML) y los archivos estáticos (CSS, imágenes).
"""

import os
from pathlib import Path

# Carpeta raíz del proyecto (donde está manage.py)
BASE_DIR = Path(__file__).resolve().parent.parent

# --- Seguridad -------------------------------------------------------------
# En producción estos valores se leen de variables de entorno.
# En vuestro ordenador se usan los valores por defecto y no hay que tocar nada.
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "solo-para-desarrollo-cambiar-en-produccion-foodbridge",
)
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")


# --- Apps del proyecto -----------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Nuestras apps
    "cuentas",
    "lotes",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "foodbridge.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "foodbridge.wsgi.application"


# --- Base de datos ---------------------------------------------------------
# SQLite: un solo archivo (db.sqlite3). No hay que instalar nada.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# --- Usuarios --------------------------------------------------------------
# Usamos nuestro propio modelo de usuario (con rol: comercio, ONG o admin).
AUTH_USER_MODEL = "cuentas.Usuario"

LOGIN_URL = "cuentas:login"
LOGIN_REDIRECT_URL = "cuentas:panel"
LOGOUT_REDIRECT_URL = "inicio"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# --- Idioma y hora ---------------------------------------------------------
LANGUAGE_CODE = "es-es"
TIME_ZONE = "Europe/Madrid"
USE_I18N = True
USE_TZ = True


# --- Archivos estáticos (CSS, imágenes del diseño) -------------------------
STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"  # se usa al publicar en internet

# Fotos que suben los comercios
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
