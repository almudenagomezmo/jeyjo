## Context

- **Estado actual:** `PortalTopBar` sin campana; `/intranet/mi-cuenta` y `/intranet/stock` son scaffolds. OMS (#20) cambia `jeyjoStatus` vía API staff sin avisar al cliente. Presupuestos (#19) envían solo email de solicitud (`quote-request-confirmation-email`); cambios de estado y caducidad están diferidos. `ErpDocumentsReader` stub lanza `ERP_NOT_IMPLEMENTED`. No existe tabla `NOTIFICACION` del modelo arquitectura (04) en Supabase.
- **Requisitos:** **RF-022** (tres eventos), **US-21** (factura + centro + preferencias), **CA-B2B-006** (email + portal &lt; 5 min), **RI-009** (Resend, reintentos), **MOD-08** (Realtime + email).
- **Dependencias:** portal #22, OMS #20, quotes #19 con `validUntil`.

## Goals / Non-Goals

**Goals:**

- Tablas Supabase + RLS + despacho unificado `dispatchNotification({ profileIds, type, payload })`.
- Campana intranet con Realtime y APIs REST.
- Preferencias por categoría (`invoice`, `order`, `quote`) y canal (`email` | `portal` | `off`).
- Emails transaccionales para los cuatro tipos de evento RF-022 aplicables en v1.
- Hook pedido + hooks quote + cron facturas + cron caducidad presupuesto.
- Stub ERP facturas suficiente para **CA-B2B-006** en staging.

**Non-Goals:**

- UI listado facturas PDF (#37), wishlist stock (#35), RMA (#27), B2C `/cuenta`, permisos subusuario (#26).

## Decisions

### 1. Tablas Supabase

**Decisión:**

```text
notifications (
  id uuid PK,
  web_profile_id uuid FK → web_profiles,
  customer_id uuid FK → customers,  -- denormalized for staff queries
  type text NOT NULL,  -- invoice_new | order_status | quote_status | quote_expiring
  title text NOT NULL,
  body text,
  payload jsonb,       -- { orderNumber, quoteNumber, invoiceId, amount, href, ... }
  read_at timestamptz,
  email_sent_at timestamptz,
  idempotency_key text UNIQUE,  -- e.g. order:uuid:status:shipped
  created_at timestamptz
)

notification_preferences (
  web_profile_id uuid PK FK,
  invoice_channel text DEFAULT 'email',   -- email | portal | off
  order_channel text DEFAULT 'email',
  quote_channel text DEFAULT 'email',
  email_disabled_at timestamptz NULL,
  updated_at timestamptz
)

erp_invoice_sync_state (
  customer_id uuid PK,
  last_synced_at timestamptz,
  last_invoice_ids jsonb  -- array of ERP ids seen
)
```

RLS: `notifications` SELECT/UPDATE solo `web_profile_id = auth.uid()`; INSERT solo `service_role` o función security definer `dispatch_notification`. Preferencias: SELECT/UPDATE propio perfil.

**Alternativa descartada:** Payload collection para notificaciones — mezcla datos cliente con CMS staff y complica Realtime.

### 2. Despacho (`dispatchNotification`)

**Decisión:** Módulo `apps/storefront/src/lib/notifications/dispatch.ts` (o `packages/notifications` si CMS también importa — preferir **duplicar thin wrapper en CMS** que importe la misma firma vía copia mínima en `apps/cms/src/lib/notifications/` llamando Supabase service client para evitar dependencia circular storefront↔cms).

Flujo:

1. Resolver `profileIds` (todos `web_profiles` con `customer_id` y `role = 'b2b'` para eventos empresa).
2. `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING` por perfil si canal portal ≠ off.
3. Si canal email ≠ off y no `email_disabled_at`, encolar envío (await en hook, async en cron con límite).
4. `supabase.channel('notifications:{profileId}')` — cliente suscrito en campana.

**Alternativa descartada:** Solo email sin fila in-app — incumple US-21 CA2.

### 3. UI campana (`PortalTopBar`)

**Decisión:** Client component `NotificationBell` en barra portal: icono campana, badge count no leídas, `Popover` con lista (últimas 20), acciones “Marcar leída” / “Ver todas” (panel completo opcional en mismo popover paginado). Tokens `globals.css` (`bg-surface`, `text-text-secondary`). Suscripción Realtime + refetch en focus.

APIs:

- `GET /api/intranet/notifications?unreadOnly&limit&cursor`
- `PATCH /api/intranet/notifications` body `{ ids: uuid[] }` o `{ markAll: true }`
- `GET/PATCH /api/intranet/notification-preferences`

**Alternativa descartada:** Página dedicada `/intranet/notificaciones` como única UX — se añade redirect opcional desde “Ver todas” pero v1 prioriza popover en cabecera (US-07 no lista sección extra; campana en cabecera es el contrato).

### 4. Emails (RI-009)

**Decisión:** Reutilizar patrón `sendQuoteRequestEmail` en CMS (`@payloadcms/email` + React Email). Nuevas funciones en `apps/cms/src/lib/notifications/emails/`:

| Tipo | Asunto |
|------|--------|
| `invoice_new` | Nueva factura disponible en tu portal Jeyjo |
| `order_status` | Tu pedido {orderNumber} — {statusLabel} |
| `quote_expiring` | Tu presupuesto {quoteNumber} caduca en 7 días |
| `quote_status` | Actualización de tu presupuesto {quoteNumber} |

Fallo email no revierte notificación in-app. Reintento: 3 intentos exponenciales en 24h (cola simple: campo `email_attempts` en payload o tabla `notification_email_queue` ligera — **v1:** reintento inline en cron horario si `email_sent_at` null y `created_at` &lt; 24h).

**Alternativa descartada:** Resend directo desde storefront sin CMS — duplica configuración SMTP ya centralizada en Payload.

### 5. Evento pedido (OMS)

**Decisión:** Hook `afterChange` en colección `Orders` cuando `jeyjoStatus` cambia y nuevo valor ∈ `{ confirmed, preparing, shipped, delivered, cancelled }` y `origin` incluye B2B o `customerRef` presente. Payload incluye `orderNumber`, etiqueta ES, `href: /intranet/pedidos`. No notificar `pending_payment` ni estados internos staff-only.

Invocación: CMS hook → Supabase service role → `dispatchNotification`.

### 6. Evento presupuesto

**Decisión:**

- **Transición:** hook `afterChange` en `Quotes` cuando `status` pasa a `sent`, `accepted`, `cancelled` y hay `customerRef` B2B (o email empresa). Email + in-app según preferencias `quote`.
- **Caducidad:** Vercel cron `GET /api/cron/quote-expiry-notifications` (secret `CRON_SECRET`) diario 08:00 Europe/Madrid — busca Payload quotes `status` ∈ `sent`,`accepted`, `validUntil` = hoy+7 días, `idempotency_key` `quote:{id}:expiring:{date}`.

Staff puede setear `validUntil` manualmente (ya existe en colección).

### 7. Evento factura (sync stub)

**Decisión:**

1. Extender `ErpInvoiceListItem` en erp-ports: `{ id, issuedAt, totalAmount, currency, customerErpCode }`.
2. Stub `listInvoicesByCustomer(erpCustomerCode, since?)` con fixture `empresa@test.com` incluyendo factura nueva en escenario CA-B2B-006.
3. Cron `GET /api/cron/invoice-sync` cada 5 min: por cada `customers` con `erp_customer_code`, llamar stub, diff vs `erp_invoice_sync_state`, para cada id nuevo → `dispatchNotification` tipo `invoice_new` con importe y `href: /intranet/contabilidad/facturas`.

Sin almacenar PDF ni filas documentales completas (#37 las materializará).

**Alternativa descartada:** Esperar #37 para cualquier notificación de factura — bloquea US-21 y CA-B2B-006 explícitos en roadmap #28.

### 8. Mi cuenta — preferencias

**Decisión:** Reemplazar scaffold `/intranet/mi-cuenta` por formulario simple (tres toggles radio: email / solo portal / desactivado por categoría). Guardado vía PATCH preferences API. Mostrar aviso si `email_disabled_at` (bounce).

### 9. Subusuarios v1

**Decisión:** Notificar todos los `web_profiles` con mismo `customer_id` y `role = 'b2b'`. #26 podrá filtrar por `permissions` después.

## Risks / Trade-offs

- **[Risk] Doble email a varios admins de la misma empresa** → Aceptado v1; preferencias individuales por perfil.
- **[Risk] Cron 5 min vs SLA CA-B2B-006** → Mitigación: intervalo configurable; documentar en checklist staging.
- **[Risk] CMS y storefront comparten lógica despacho** → Mitigación: tests unitarios en lib extraída o contrato documentado; service role key solo server.
- **[Risk] Realtime desconectado** → Mitigación: polling 60s con pestaña visible.
- **[Risk] Stub facturas no representa Avansuite real** → Mitigación: interfaz estable; #36/#37 sustituyen adapter sin cambiar `dispatchNotification`.

## Migration Plan

1. Aplicar migración Supabase (tablas + RLS + función insert).
2. Desplegar CMS con hooks (feature flag env `NOTIFICATIONS_ENABLED=true`).
3. Desplegar storefront (UI + APIs + crons en `vercel.json`).
4. Seed: preferencias default para perfiles B2B existentes en `seed.sql` o migración backfill `INSERT ... ON CONFLICT DO NOTHING`.
5. Rollback: desactivar flag; crons dejan de crear filas; UI oculta campana si tabla vacía.

## Open Questions

- ¿Notificar también al email principal `customers.email` además de cada `web_profile`? **Propuesta v1:** solo `web_profile.email` (coincide con login).
- ¿Estados de pedido B2C en `/cuenta` en iteración rápida post-B2B? **Fuera v1.**
- ¿Extraer `packages/notifications` compartido? **Solo si CMS import genera fricción en apply; empezar con lib CMS + storefront vía Supabase RPC.**
