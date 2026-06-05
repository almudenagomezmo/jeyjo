## Context

- **Estado actual:** `Footer.tsx` tiene columnas de catálogo y enlaces estáticos; no hay formulario newsletter ni tabla de suscriptores. Resend/Mailpit operativo en Payload (#28); grupo Marketing en CMS con cupones y abandoned cart (#31). Auth B2C/B2B (#16) expone `web_profiles` y email de cuenta. Alcance §1.14 exige suscripción frontend + gestión backoffice + ESP externo; decisión de proveedor (Brevo vs Mailchimp vs solo Resend) sigue abierta en requisitos.
- **Requisitos:** Alcance §1.14, §1.12 (pie con newsletter), **RI-009** (transporte transaccional).
- **Dependencias satisfechas:** #9 shell, #16 auth, #28 email.

## Goals / Non-Goals

**Goals:**

- Tabla `newsletter_subscribers` en Supabase con double opt-in y tokens confirm/unsubscribe.
- API pública subscribe con consentimiento GDPR, rate limit y mensajes anti-enumeración.
- Emails confirmación y páginas `/newsletter/confirm` / `/newsletter/unsubscribe` en storefront.
- Adaptador `NewsletterEspPort` con Brevo en prod y noop en dev.
- Global CMS `newsletter-settings` + vista staff listado/export/resync.
- Bloque newsletter en `Footer` consumiendo copy del global.

**Non-Goals:**

- Envío de campañas masivas desde Jeyjo; Mailchimp en v1; pie completo (#40); import WordPress; suscripción checkout obligatoria; cupón bienvenida automático.

## Decisions

### 1. Tabla `newsletter_subscribers`

**Decisión:**

```text
newsletter_subscribers (
  id uuid PK DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_normalized text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('pending','confirmed','unsubscribed')),
  confirm_token text NOT NULL,
  unsubscribe_token text NOT NULL,
  consent_at timestamptz NOT NULL,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  source text NOT NULL DEFAULT 'footer' CHECK (source IN ('footer','account')),
  web_profile_id uuid REFERENCES web_profiles(id) ON DELETE SET NULL,
  esp_contact_id text,
  esp_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

Índices: `email_normalized` (unique), `(status, created_at)` para listado staff.

RLS: sin políticas `SELECT` para `authenticated`/`anon`; todas las mutaciones vía `service_role` en route handlers storefront/CMS. Evita filtraciones desde cliente Supabase.

**Alternativa descartada:** Payload collection — suscripciones públicas anónimas y alto volumen encajan mejor en Supabase con RLS cerrado, igual que notificaciones (#28).

### 2. Flujo subscribe y tokens

**Decisión:**

| Paso | Actor | Acción |
|------|-------|--------|
| 1 | Visitante | POST `/api/newsletter/subscribe` con consent |
| 2 | Storefront API | Upsert row `pending`, generar `confirm_token` + `unsubscribe_token` (crypto.randomUUID) |
| 3 | CMS email lib | Enviar confirmación con link absoluto `STOREFRONT_URL/newsletter/confirm?token=` |
| 4 | Visitante | GET confirm → service role update `confirmed` → `syncEspUpsert` |
| 5 | Visitante | GET unsubscribe → `unsubscribed` → `syncEspRemove` |

Expiración confirm: 7 días desde `updated_at` cuando `status = pending`. Respuestas API genéricas: siempre 200 con "Revisa tu correo" salvo validación/rate limit.

Rate limit: tabla en memoria o Upstash/Vercel KV opcional; v1 implementar contador por IP+email en Supabase tabla `newsletter_rate_limits` con TTL 1h (simple, sin dependencia nueva).

**Alternativa descartada:** JWT firmado — más complejo para staff resend; UUID en columna es suficiente con HTTPS.

### 3. Transporte email (Resend) vs ESP (Brevo)

**Decisión:** Separar responsabilidades:

- **Resend/Mailpit** (Payload `payload.sendEmail` o SDK Resend en `apps/cms/src/lib/newsletter/send-confirmation.ts`): solo emails transaccionales double opt-in y plantilla mínima React Email.
- **Brevo REST API** (`apps/cms/src/lib/newsletter/esp/brevo.ts`): contactos en lista `BREVO_NEWSLETTER_LIST_ID`; atributos `SOURCE`, `SEGMENT` (`b2c` default; `b2b` si `web_profile_id` apunta a perfil con `customer_id`).

`createNewsletterEspPort()` en `esp/index.ts` devuelve `BrevoEspAdapter` o `NoopEspAdapter`.

Sync invocado desde storefront confirm route vía internal API `POST /api/internal/newsletter/sync` (CMS) con shared secret `NEWSLETTER_INTERNAL_SECRET`, o directamente en storefront con Brevo SDK si se prefiere un solo deploy — **preferir llamada CMS** para centralizar credenciales ESP en `apps/cms` junto a otros emails.

**Alternativa descartada:** Resend Audiences para lista marketing — no cumple alcance de ESP externo dedicado y mezcla transaccional con campañas.

### 4. Storefront UI (`NewsletterSignup`)

**Decisión:** Componente cliente `NewsletterSignup.tsx` en footer:

- Server wrapper fetch `GET /api/newsletter/settings` (lee global Payload cacheado) para headline/description/privacy URL/enabled.
- Form: `Input` email, `Checkbox` consent con `Link` a política, `Button` submit.
- Estados: idle, submitting, success ("Te hemos enviado un email de confirmación"), error.
- Grid footer: añadir columna `Newsletter` en `md:grid-cols-[1.4fr_repeat(4,1fr)]` o fila dedicada sobre copyright si 4 columnas rompe diseño — validar contra jeyjo-next; fallback fila full-width sobre barra inferior.

Pre-fill email: `GET` session en server component padre, pasar `defaultEmail` prop.

**Alternativa descartada:** Modal signup — alcance pide bloque en pie, no interstitial.

### 5. CMS admin

**Decisión:**

- Global `NewsletterSettings` en `apps/cms/src/globals/NewsletterSettings.ts`, grupo Marketing.
- Vista custom `NewsletterSubscribers` como Payload custom view o endpoint en `src/endpoints/newsletter-subscribers.ts` registrado en `payload.config.ts` admin nav — listado paginado vía Supabase service client, filtros query params, CSV stream response.
- Acciones staff: `resendConfirmation(subscriberId)`, `resyncEsp(subscriberId)` en `src/lib/newsletter/admin-actions.ts`.

Access: reutilizar helper `marketingStaffUpdate` de MarketingSettings (#31).

**Alternativa descartada:** Duplicar datos en Payload collection — fuente única Supabase.

### 6. Páginas confirm/unsubscribe

**Decisión:** App Router en `apps/storefront/src/app/newsletter/confirm/page.tsx` y `unsubscribe/page.tsx`:

- Server action o route handler interno valida token con Supabase service role.
- Tras mutación, llama sync CMS (fire-and-forget con await en server).
- Render mensaje éxito/error con `Container` + tokens; sin redirect externo.

## Risks / Trade-offs

- **[Proveedor ESP no confirmado]** → Implementar puerto + Brevo por defecto; noop si faltan credenciales; cambio de proveedor sin tocar storefront.
- **[Sync Brevo falla post-confirm]** → Estado local `confirmed` prevalece; staff resync manual; log + alerta opcional en dashboard (#30 futuro).
- **[Spam en subscribe API]** → Rate limit + honeypot field oculto en form; sin CAPTCHA en v1.
- **[Enumeración de emails]** → Respuestas genéricas 200; logs solo server-side.
- **[GDPR sin registro de consentimiento versionado]** → `consent_at` + URL política en settings; ampliar versión en iteración si legal lo exige.

## Migration Plan

1. Aplicar migración Supabase `newsletter_subscribers` (+ opcional `newsletter_rate_limits`).
2. Desplegar CMS con global, emails, adaptador Brevo y endpoint staff.
3. Desplegar storefront con API, páginas confirm/unsubscribe y footer.
4. Configurar env producción: `BREVO_API_KEY`, `BREVO_NEWSLETTER_LIST_ID`, `NEWSLETTER_INTERNAL_SECRET`, `STOREFRONT_URL`.
5. Smoke test: subscribe → Mailpit/Resend → confirm → verificar contacto Brevo sandbox.
6. Rollback: desactivar `enabled` en global (oculta form, 503 API); no borrar tabla.

## Open Questions

1. **Dirección:** ¿Confirmar Brevo como ESP v1 o preferir Mailchimp? (Pendiente alcance §pendientes.)
2. **Legal:** ¿Texto exacto del checkbox de consentimiento y versión de política a almacenar?
3. **Cuenta cliente:** ¿Bloque opt-in también en `/cuenta` en v1 o solo footer? (Propuesta: footer obligatorio; `/cuenta` opcional en tasks si tiempo.)
