## Why

RF-004 exige que el equipo de Jeyjo valide registros del storefront, asigne el grupo de cliente correcto (1–4) y habilite el segmento B2C o B2B. La vista actual `/admin/pending-customers` solo lista pendientes, ofrece dos botones (grupos 1 y 2), no aparece en un flujo admin completo y no envía email al aprobar — mientras Supabase sí envía el email de confirmación de dirección, lo que confunde al cliente. Este cambio entrega la bandeja operativa que administración necesita sin duplicar `public.customers` en Payload.

## What Changes

- Sustituir la vista pendientes por **Clientes** en `/admin/customers`: listado completo desde Supabase, filtro por defecto «pendientes», filtros por estado/grupo/búsqueda email-CIF.
- **Ficha de solo lectura** por cliente con datos de registro y perfiles `web_profiles` vinculados (role, is_active, last_login_at).
- **Validar** con selector de grupo 01–04 y etiquetas de negocio (B2C, B2B empresa, colegio/instituto, concurso público); bloqueo si el email de Supabase Auth no está confirmado.
- **Email transaccional obligatorio** al validar (Resend/Mailpit vía Payload): plantilla B2C vs B2B; incluye CIF cuando aplique y grupo asignado; enlace a `/cuenta` o `/intranet`.
- Reutilizar `POST /next/customers/:id/validate` (staff + MFA + `audit_log`); ampliar API de listado/detalle vía endpoints CMS.
- Redirect `/admin/pending-customers` → `/admin/customers?status=pending`; alerta dashboard apunta al listado filtrado.
- Delta en specs: clarificar dos emails (confirmación Supabase vs aprobación CMS) y requisitos de la cola admin ampliada.
- **Non-goals v1:** colección Payload sobre `public.customers`; edición de campos distintos de validar; validar sin email confirmado; sync/vinculación ERP por CIF (RI-001); caducidad automática de grupos 3–4; cambio de grupo post-validación (follow-up); baja masiva de clientes.

## Capabilities

### New Capabilities

_(ninguna — se extienden capabilities existentes)_

### Modified Capabilities

- `cms-customer-validation-queue`: listado completo, ficha, filtros, selector grupos 1–4 con etiquetas, bloqueo sin email confirmado, email de aprobación.
- `storefront-customer-auth`: separación explícita email confirmación (Supabase) vs email cuenta aprobada (CMS); sin cambio de redirects login.

## Impact

- **CMS:** `PendingCustomersView` → vista Clientes; `endpoints/pending-customers.ts` generalizado; `validate/route.ts` + nuevo módulo email; `payload.config.ts`; `alerts.ts`; tests integración.
- **Storefront:** solo copy/mensajes si hace falta alinear expectativas de los dos emails (sin cambio de rutas auth).
- **Supabase:** sin migraciones de esquema; lecturas/escrituras vía `service_role` existente en CMS.
- **Specs:** deltas en `openspec/changes/cms-customer-accounts-admin/specs/`.
- **Dependencias:** auth registro (#16), email Payload (#28), MFA staff (#5); no bloquea ERP sync.
