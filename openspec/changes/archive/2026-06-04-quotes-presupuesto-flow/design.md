## Context

- **Estado actual:** `/cart` muestra el botón **Solicitar presupuesto** deshabilitado con copy "Próximamente". Checkout (#17) y OMS (#20) implementan pedidos con snapshots, numeración, bandejas staff y email vía Resend/Mailpit en Payload. No existe colección `quotes` ni tabla Supabase dedicada. Intranet `/intranet/contabilidad/presupuestos` es scaffold; `/cuenta` no lista presupuestos.
- **Arquitectura:** Payload es sistema de registro v1 para presupuestos web (como pedidos); sync documental Avansuite queda en #37. Patrones a reutilizar: `OmsInboxView`, `status-transitions.ts` de orders, `prepare`/`place-order`, `sendOrderAccessEmail`, access `staffRoles`.
- **Referencias:** RF-015, US-05, RI-009; ROADMAP #19 tras #17 y #20.

## Goals / Non-Goals

**Goals:**

- Colección Payload `quotes` con estados RF-015 y snapshots alineados a orders.
- Flujo storefront anónimo + autenticado desde carrito y checkout sin paso de pago.
- Email transaccional al solicitar (CA4).
- Bandeja admin con transiciones staff y conversión a pedido.
- Listado básico en cuenta cliente autenticada.

**Non-Goals:**

- Sync ERP, PDF cliente, centro notificaciones (#28), caducidad automática, área documental (#37). Ver proposal.

## Decisions

### 1. Payload `quotes` collection (no Supabase table v1)

**Decisión:** Nueva colección Payload `quotes` (no plugin ecommerce) con campos espejo de checkout: `quoteNumber`, `status`, `segment` (b2c/b2b), `customerRef`, `guestEmail`, `lineSnapshots` (json array), `deliveryMethod`, address snapshots, `customerNotes`, `subtotal`, `shippingCost`, `total`, `convertedOrderRef` (relationship orders, nullable), `validUntil` (date nullable, sin job v1).

Estados: `requested` | `in_review` | `sent` | `accepted` | `ordered` | `cancelled`.

**Rationale:** Consistencia con OMS; staff ya opera en Payload; evita duplicar RLS Supabase hasta necesidad de Realtime (#28).

**Alternativa descartada:** Tabla `quotes` en Supabase — más capas sin beneficio inmediato.

### 2. Flujo storefront: ruta dedicada `/presupuesto`

**Decisión:** Desde `/cart` y `/checkout`, el CTA navega a `/presupuesto` (single-page flow, máx. 2 pasos: contacto/entrega opcional → revisión). Reutiliza componentes checkout (observaciones, email invitado, dirección si autenticado) pero **sin** selector de pago.

APIs en storefront:
- `POST /api/quotes/prepare` — valida carrito, recomputa pricing/shipping, devuelve token firmado (mismo patrón HMAC que checkout prepare).
- `POST /api/quotes/request` — crea documento Payload vía CMS REST con API key; dispara email; limpia carrito; redirige a `/presupuesto/confirmacion?ref=...`.

**Rationale:** Separa UX de pedido vs presupuesto; evita bifurcar checkout de pagos (#18).

**Alternativa descartada:** Modal en carrito — insuficiente para entrega/observaciones US-04 parity.

### 3. Creación vía CMS endpoint interno

**Decisión:** Endpoint CMS `POST /api/quotes/storefront-create` (API key `STOREFRONT_PAYLOAD_API_KEY`) que:
1. Valida prepare token y líneas.
2. Asigna `quoteNumber` (hook `beforeValidate`, formato `P-{YYYY}-{seq}`).
3. Persiste con `status=requested`.
4. Llama `sendQuoteRequestEmail`.

Storefront no escribe directamente en Payload REST público.

**Rationale:** Misma frontera de seguridad que place-order; numeración atómica en CMS.

### 4. Transiciones staff

**Decisión:** Matriz en `apps/cms/src/collections/Quotes/status-transitions.ts`:

| Desde | Hacia permitido |
|-------|-----------------|
| `requested` | `in_review`, `cancelled` |
| `in_review` | `sent`, `cancelled` |
| `sent` | `accepted`, `cancelled` |
| `accepted` | `ordered`, `cancelled` |
| `ordered` | — (terminal) |

Endpoint `PATCH /api/quotes/:id/status` (staff) + validación `beforeChange`. UI bandeja `/admin/quotes` (componente `QuotesInboxView`).

**Rationale:** RF-015 CA3; auditoría vía hooks existentes.

### 5. Conversión Aceptado → Pedido

**Decisión:** Acción staff **Convertir a pedido** solo desde `accepted`:
- Crea `orders` document copiando snapshots y totales.
- `origin` y `jeyjoStatus` según segmento (B2C `pending_payment` sin gateway preseleccionado transfer; B2B `pending_confirmation`).
- Actualiza quote: `status=ordered`, `convertedOrderRef`.
- No auto-inicia pago Redsys.

**Rationale:** Presupuesto es intención comercial; pedido entra en OMS existente (#20).

**Alternativa descartada:** Auto-crear pedido al solicitar — contradice flujo revisión/envío.

### 6. Email transaccional (RI-009)

**Decisión:** `sendQuoteRequestEmail` en CMS usando `payload.sendEmail` (Mailpit dev / Resend prod). Template HTML mínimo: número presupuesto, resumen líneas, contacto Jeyjo. Hook `afterChange` en quote preparado para futuros emails de cambio de estado (#28) pero **solo envía en create** en v1.

**Rationale:** CA4 explícito; infra ya configurada.

### 7. Acceso staff

**Decisión:** `quotes` collection access: read/update `administracion|superadmin`; create vía API key + staff; deny `catalogo`. Custom view `/admin/quotes` mismo gate que OMS.

**Rationale:** CA-BACKEND-006 parity.

### 8. Cuenta cliente

**Decisión:** `/cuenta/presupuestos` lista quotes donde `customerRef` = sesión Supabase customer id, vía storefront server `GET /api/quotes/mine` → CMS filtered query con service role o API key server-side.

**Rationale:** US-05 CA2 para registrados; anónimos solo email de confirmación.

## Risks / Trade-offs

- **[Precios obsoletos al convertir]** → Snapshot congelado en quote; conversión usa snapshot del presupuesto, no re-pricing live (staff puede cancelar y pedir nuevo presupuesto).
- **[Doble submit]** → Idempotency key en prepare token + reject duplicate quoteNumber race via unique index.
- **[Email fallido no bloquea create]** → Log error + flag `emailSentAt` nullable; staff ve warning en bandeja.
- **[Anónimo sin cuenta]** → Solo email; no listado hasta registro con mismo email (out of scope v1).

## Migration Plan

1. Desplegar CMS con colección `quotes` (Payload migrate automático).
2. Desplegar endpoints CMS antes de activar botones storefront.
3. Desplegar storefront con feature flag `QUOTES_ENABLED=true` (env) para staging; producción tras checklist manual.
4. Rollback: desactivar flag storefront; colección quotes queda inerte.

## Open Questions

- ¿Staff debe poder editar líneas/cantidades en revisión o solo totales en ERP offline? **v1: solo transiciones, sin edición de líneas.**
- ¿Plazo de validez por defecto (`validUntil`)? **Propuesta: 30 días desde `sent`, campo manual staff; sin email caducidad hasta #28.**
- ¿B2B intranet debe solicitar presupuesto desde portal además de tienda? **v1: mismo flujo `/presupuesto` accesible logueado B2B; intranet scaffold enlaza a tienda o listado cuenta.**
