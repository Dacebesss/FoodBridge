# 3 · Cuentas y roles

**Responsable:** Juan Diego Ramírez · **Rama:** `3-cuentas-roles` · Volver a [[0-reparto]]

## Qué es tu parte
Quién puede entrar y qué puede hacer cada uno: registro, inicio de sesión, los tres tipos de usuario y la
aprobación de las entidades sociales.

## Tus archivos
| Archivo | Qué es |
|---|---|
| `cuentas/models.py` | La tabla de **usuarios**: email, rol, estado, nombre de la entidad, municipio, CIF… |
| `cuentas/forms.py` | Los formularios de registro y de entrar. |
| `cuentas/views.py` | Las páginas: registro en dos pasos, entrar y el **panel** de cada rol. |
| `cuentas/admin.py` | El panel `/admin`, con los botones «Aprobar» y «Rechazar» cuentas. |
| `cuentas/urls.py` | Las direcciones: `/cuentas/entrar/`, `/cuentas/registro/`, `/cuentas/panel/`… |
| `cuentas/management/commands/datos_demo.py` | Crea las cuentas y lotes de prueba. |
| `cuentas/tests.py` | Las pruebas automáticas de esta parte. |
| `templates/cuentas/` | El HTML: registro, login y los paneles de comercio, entidad y admin. |

## Cómo funciona
- **Se entra con el email**, no con nombre de usuario. La contraseña se guarda **cifrada** (Django nunca la guarda tal cual).
- **Tres roles:**
  - **Comercio:** queda aprobado al registrarse y puede publicar al momento.
  - **Entidad social** (ONG, comedor): tiene que dar su **nº de registro o CIF** y queda **pendiente** hasta que
    un administrador la apruebe. Así nadie se hace pasar por una ONG para llevarse comida.
  - **Administrador:** aprueba o rechaza entidades desde `/admin`.
- **Cada cuenta guarda su municipio.** Una entidad solo ve los lotes de su municipio; así la web puede crecer a otros
  pueblos sin cambiar nada.
- **Cada rol ve su panel** en `/cuentas/panel/`: el comercio, sus lotes; la entidad, los lotes disponibles y sus
  reservas; el admin, las entidades pendientes y los totales.

## Cómo probarlo
Cuentas de prueba (contraseña `foodbridge2026`): `plaza@foodbridge.es` (comercio), `sanjose@foodbridge.es`
(entidad aprobada), `despensa@foodbridge.es` (entidad pendiente). Registra una entidad nueva y apruébala desde el
panel de admin (la contraseña del admin la tiene Diego).

## Lo que queda
- [ ] «He olvidado mi contraseña» (hoy no existe).
- [ ] Avisar a la entidad cuando la aprueban (mensaje o email).
- [ ] Revisar que los textos del registro se entienden sin ayuda.

## Preguntas que te puede hacer el profesor
- **¿Cómo sabéis que una ONG es real?** Pide su nº de registro o CIF y un administrador la revisa antes de aprobarla.
- **¿Las contraseñas están seguras?** Se guardan cifradas con el sistema de Django; ni nosotros podemos leerlas.
- **¿Cómo crecería a otro municipio?** Cada cuenta tiene su municipio y cada entidad solo ve los lotes del suyo.
