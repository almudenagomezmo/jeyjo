## Why

El portal B2B (#22) y el OMS web (#20) ya permiten operar pedidos y presupuestos, pero no existe **RF-022**: el cliente no recibe avisos proactivos en el portal ni por email cuando cambia un pedido, caduca un presupuesto o aparece una factura nueva. **US-21** y **CA-B2B-006** exigen un centro de notificaciones (campana en cabecera) y email transaccional opcional en menos de 5 minutos tras el evento. Es el cambio **#28** del ROADMAP; dependencias #20 y #22 completadas. Sin esta base, #35 (avisos wishlist/stock) y #37 (área documental) no pueden reutilizar un canal de notificación unificado.

## What Changes

- **Modelo Supabase:** tablas `notifications` y `notification_preferences` por `web_profile` (tipos: `invoice_new`, `order_status`, `quote_expiring`, `quote_status`); RLS por usuario; índices para listado no leídas.
- **Servicio de notificación (MOD-08):** función de despacho idempotente (insert in-app + email según preferencias) invocable desde CMS hooks y jobs storefront.
- **Centro en portal:** campana en `PortalTopBar`, badge de no leídas, panel desplegable, marcar leída / marcar todas, enlaces a `/intranet/contabilidad/facturas`, `/intranet/pedidos` o presupuestos según tipo; actualización en tiempo real vía Supabase Realtime (fallback polling).
- **Preferencias US-21 CA3:** sección en `/intranet/mi-cuenta` — canal `email`, `portal` o `off` por categoría de evento (factura, pedido, presupuesto).
- **Emails RI-009:** plantillas React Email + transporte Payload/Resend existente para: nueva factura (`"Nueva factura disponible en tu portal Jeyjo"` + importe), cambio de estado de pedido, presupuesto próximo a caducar (7 días), cambio de estado de presupuesto (staff → cliente B2B).
- **Evento pedido:** hook Payload al cambiar `jeyjoStatus` en `orders` → notificación a perfiles B2B del `customerRef` con resumen y enlace.
- **Evento presupuesto:** hook en transiciones `quotes` relevantes para cliente; job diario que detecta `validUntil` a 7 días para quotes en `sent`/`accepted`.
- **Evento factura (US-21):** ampliar stub `ErpDocumentsReader` con listado por cliente; job de sincronización que compara facturas nuevas vs watermark en Supabase y dispara notificación (sin UI documental PDF — eso queda en #37).
- **APIs storefront:** `GET/PATCH /api/intranet/notifications`, `GET/PATCH /api/intranet/notification-preferences`.
- **Tests:** unit (despacho, preferencias, idempotencia), integración (CA-B2B-006 fixture empresa@test.com), checklist manual US-21.

## Capabilities

### New Capabilities

- `b2b-notification-service`: Persistencia, RLS, despacho idempotente portal+email, Realtime y contrato de tipos de evento (**RF-022**).
- `storefront-b2b-notification-center`: UI campana, listado, marcar leídas, APIs intranet (**US-21** CA2).
- `storefront-b2b-notification-preferences`: Preferencias por canal en mi cuenta (**US-21** CA3).
- `b2b-proactive-notification-emails`: Plantillas y envío transaccional Resend/Mailpit (**RI-009**, CA-B2B-006).
- `erp-invoice-notification-sync`: Stub `ErpDocumentsReader` + job sync facturas nuevas → evento `invoice_new` (preparación **#37**).

### Modified Capabilities

- `storefront-b2b-portal-shell`: Campana de notificaciones y badge en barra superior del portal; sustituir scaffold de contacto como “centro de mensajes” por enlace al panel de notificaciones.
- `payload-order-collection`: Requisito de emisión de notificación al cambiar `jeyjoStatus` hacia estados visibles para el cliente B2B.
- `payload-quote-collection`: Notificaciones en transiciones staff visibles para el cliente; job de caducidad 7 días antes de `validUntil`.
- `quote-request-confirmation-email`: Ampliar alcance: emails de cambio de estado de presupuesto (antes diferido a #28).

## Impact

- `supabase/migrations`: nuevas tablas `notifications`, `notification_preferences`, opcional `erp_invoice_sync_state`.
- `apps/storefront`: componentes `NotificationBell`, APIs intranet, job/cron route para sync facturas y quote expiry, `lib/notifications/**`.
- `apps/cms`: hooks en `Orders` y `Quotes`, servicio email compartido o import desde lib común, endpoint interno opcional para sync facturas invocado por cron.
- `packages/erp-ports`: stub `ErpDocumentsReader` con `listInvoicesByCustomer` y fixtures **CA-B2B-006**.
- Infra: Resend/Mailpit ya configurado (#5, presupuestos #19); Vercel cron para jobs.
- Cumple **RF-022**, **US-21**, **CA-B2B-006**; desbloquea **#35** (stock alerts) y alinea con **#37** (UI documental reutiliza mismos eventos).
- Dependencias satisfechas: **#20** OMS, **#22** portal, **#19** quotes (`validUntil`).

## Non-Goals

- **Wishlist / avisos de stock** en PDP o `/intranet/stock` (**#35**); solo infraestructura reutilizable.
- **UI documental** con listado PDF, descargas y vencimientos (**#37**); facturas en portal siguen en scaffold salvo enlace desde notificación.
- **Notificaciones B2C** en `/cuenta` (v1 solo intranet B2B validado).
- **Subusuarios y permisos RF-003** (#26): todos los perfiles de la empresa reciben notificaciones de pedidos/facturas de la cuenta v1.
- **RMA** confirmación email (**#27**, RF-021) — tipo de evento reservado, sin plantilla en este cambio.
- **Marketing:** carrito abandonado, cupones (**#31**).
- **Push móvil / SMS**; solo portal + email.
- **Escritura ERP** de documentos; sync facturas es solo lectura.

## Assumptions

- Destinatario email: email del `web_profile` activo; si varios perfiles B2B por empresa, todos con rol `b2b` reciben notificación de pedido/factura de su `customer_id` (v1 sin filtro por subusuario).
- SLA “menos de 5 minutos” (**CA-B2B-006**): job sync facturas cada 5 min en staging/prod; hooks pedido/presupuesto son inmediatos.
- Idioma plantillas: español; importes con formato EUR.
- Hard bounce Resend desactiva email para ese perfil (RI-009) — registro en `notification_preferences.email_disabled_at`.
