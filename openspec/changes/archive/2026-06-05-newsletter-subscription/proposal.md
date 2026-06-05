## Why

El pie de página del storefront (#9) y el alcance §1.12 exigen un bloque de **newsletter**, pero hoy `Footer.tsx` solo muestra enlaces estáticos sin formulario de suscripción ni persistencia. El alcance §1.14 define un módulo completo de suscripción en frontend y gestión de lista en backoffice, con integración a un servicio de email marketing externo, como canal de recuperación de clientes inactivos. Resend y el transporte transaccional ya están operativos (#28, #31); falta la captura GDPR-compliant, confirmación double opt-in y sincronización con el ESP para campañas. Dependencias satisfechas: **#9** shell, **#16** auth (vincular suscriptores registrados), **#28** email transaccional.

## What Changes

- **Tabla Supabase `newsletter_subscribers`:** email normalizado, estado (`pending` | `confirmed` | `unsubscribed`), token de confirmación/baja, consentimiento marketing, origen (`footer` | `checkout` | `account`), `web_profile_id` opcional, timestamps y metadatos ESP.
- **API storefront `POST /api/newsletter/subscribe`:** validación email, rate limit, checkbox consentimiento obligatorio, creación idempotente en `pending`, envío email confirmación vía Resend (**RI-009**).
- **Ruta confirmación `GET /newsletter/confirm?token=`:** activa suscriptor, dispara sync al ESP y muestra página de éxito con tokens de diseño.
- **Ruta baja `GET /newsletter/unsubscribe?token=`:** marca `unsubscribed`, sincroniza baja en ESP, página de confirmación.
- **Adaptador ESP:** interfaz `NewsletterEspPort` con implementación **Brevo** en producción (contactos + lista configurable) y **noop** en desarrollo; credenciales en env CMS.
- **Bloque newsletter en Footer:** formulario email + consentimiento, estados loading/éxito/error, copy en español alineado con diseño jeyjo-next.
- **CMS admin Marketing:** listado/export CSV de suscriptores, filtros por estado, reenvío manual de confirmación, configuración global (lista Brevo, textos legales del formulario).
- **Vinculación cuenta:** si el usuario está logueado, asociar `web_profile_id` y pre-rellenar email en footer y `/cuenta` (opt-in explícito, no auto-suscribir).
- **Tests:** unit (estados, tokens, idempotencia), integración (subscribe → Mailpit → confirm → ESP mock), checklist manual alcance §1.14.

## Capabilities

### New Capabilities

- `newsletter-subscribers`: Persistencia Supabase, RLS staff-only lectura, máquina de estados y tokens firmados.
- `storefront-newsletter-subscribe`: UI footer + API pública de alta con consentimiento GDPR.
- `newsletter-confirmation-email`: Email double opt-in y páginas confirm/baja usando transporte Resend/Mailpit existente.
- `newsletter-esp-sync`: Puerto adaptador Brevo (+ noop dev) invocado al confirmar y al darse de baja.
- `cms-newsletter-admin`: Global settings + vista staff en grupo Marketing para gestión de lista.

### Modified Capabilities

- `storefront-app-shell`: El `Footer` SHALL incluir bloque de suscripción newsletter operativo (alcance §1.12).

## Impact

- `supabase/migrations`: tabla `newsletter_subscribers`, índices únicos en email normalizado.
- `apps/storefront`: `Footer.tsx`, `lib/newsletter/**`, rutas `/newsletter/confirm` y `/newsletter/unsubscribe`, API subscribe.
- `apps/cms`: `lib/newsletter/esp/**`, emails confirmación, global `NewsletterSettings`, endpoints staff o colección de solo lectura.
- Env: `BREVO_API_KEY`, `BREVO_NEWSLETTER_LIST_ID`, reutiliza `RESEND_*` y Mailpit.
- Cumple alcance **§1.14** y **§1.12** (pie con newsletter); prepara campañas sin acoplar envío masivo a Resend.
- Dependencias: **#9** shell, **#16** auth opcional, **#28** transporte email.

## Non-Goals

- **Envío de campañas/newsletters masivas** desde la plataforma; v1 solo captura, confirmación y sync al ESP (Brevo gestiona envíos).
- **Segmentación avanzada** (B2B vs B2C, grupos de precio, comportamiento compra); solo tags básicos en sync ESP (`source`, `segment` si perfil B2B).
- **Integración Mailchimp** en v1; arquitectura con puerto permite añadirlo después sin cambiar storefront.
- **Suscripción en checkout** como paso obligatorio; v1 solo footer + opcional bloque en `/cuenta` si se implementa en tasks.
- **Pie de página completo** (#40 `footer-eva-omnichannel-complete`): redes, tiendas, FAQ, UE funding — fuera de este cambio.
- **Blog** (#33) y **cupones/recovery** (#31); sin cruce automático suscriptor → cupón bienvenida.
- **Importación masiva** de lista WordPress legacy; manual CSV export/import vía staff si necesario.
- **SMS o push** para marketing.

## Assumptions

- **Proveedor ESP v1: Brevo** (Sendinblue) por decisión de implementación hasta confirmación de Dirección (nota abierta en alcance §pendientes); Resend solo para emails transaccionales de confirmación/baja.
- **Double opt-in obligatorio** (RGPD/LOPDGDD): estado `confirmed` solo tras clic en email; re-suscripción permitida tras `unsubscribed`.
- Email normalizado lowercase; unicidad por email en tabla (un registro activo por dirección).
- Tokens confirm/unsubscribe: UUID v4 + HMAC o JWT corta vida (confirm 7 días, unsubscribe sin caducidad hasta rotación).
- Copy footer por defecto: "Recibe ofertas y novedades de material de oficina" + enlace política privacidad.
- Rate limit: máximo 5 intentos por IP/email por hora en subscribe API.
