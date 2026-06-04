## Context

- **Estado actual:** `apps/storefront` tiene carrito (#12) con `computeShippingPreview` / `SHIPPING_RULES`, CTAs checkout deshabilitados, y auth (#16) con facturación en `customers` pero sin `customer_addresses`. `apps/cms` conserva checkout Stripe de plantilla Payload (no alineado a Jeyjo/Redsys). `payload-order-collection` define `orders` con `origin` e IVA snapshot; `default_payment_method` existe en schema tenant pero no se expone en `CustomerContext`.
- **Alcance:** US-04 CA1–CA3, RF-013 definitivo en checkout, RF-014 UI diferenciada, preparación pedido para #18–#20.
- **Referencias UX:** `especificaciones_inicio/diseño/jeyjo-next` (resumen carrito, copy portes); flujo direcciones inspirado en `apps/cms/src/components/checkout/CheckoutPage.tsx` sin reutilizar Stripe.

## Goals / Non-Goals

**Goals:**

- Ruta `/checkout` (App Router) con wizard de 2 pasos máximo: (1) entrega + observaciones, (2) revisión + forma de pago + confirmar.
- Resolver `CheckoutSegment` (`b2c` | `b2b`) desde `getCustomerContext()` + reglas `pricingCustomerGroup`; anónimo = `b2c`.
- Reutilizar `useCartSummary` + `computeCartSummary` para totales; función pura `formatShippingLine(segment, shippingCost)` para copy CA-CHECKOUT-001/002.
- Tabla `customer_addresses` + API RLS; UI en `/cuenta/direcciones` y selector en checkout.
- `POST /api/checkout/prepare` valida carrito, recalcula precios server-side, devuelve resumen firmado (HMAC o nonce en cookie httpOnly) para evitar manipulación de totales.
- `POST /api/checkout/place-order` crea documento Payload `orders` vía REST interno o SDK server con service key; estados `pending_payment` (B2C) / `pending_confirmation` (B2B).
- Habilitar enlaces `/checkout` desde `/cart` y `MiniCart`.

**Non-Goals:**

- Pasarela Redsys, webhooks, emails, OMS bandeja, presupuesto RF-015, cupones CMS, sync ERP direcciones/pago.

## Decisions

### 1. Checkout solo en storefront (no CMS template)

**Decisión:** Implementar en `apps/storefront`; Payload CMS solo persiste pedidos y staff admin.

**Alternativa descartada:** Extender checkout Stripe en `apps/cms` — desalineado con Redsys y diseño jeyjo-next.

### 2. Modelo de pasos

**Decisión:** Single-page con secciones colapsables en mobile o stepper 2 pasos: `delivery` → `review`. URL `/checkout` con query `?step=review` opcional; progreso guardado en `sessionStorage` (`jeyjo-checkout-draft`) con TTL 30 min.

**Alternativa:** 3+ pasos — viola US-04 CA1.

### 3. Métodos de entrega

**Decisión:** Enum `delivery_method`: `home` | `alternate_address` | `pickup_alfaro` | `pickup_rincon`. Recogida fuerza `shippingCost = 0` y dirección snapshot con label tienda. Envío a domicilio usa dirección seleccionada; facturación siempre de `customers` o dirección marcada `is_billing`.

**Alternativa:** Tarifas por CP — fuera de alcance España v1.

### 4. `customer_addresses`

**Decisión:** Migración Supabase:

```sql
customer_addresses (
  id uuid PK,
  customer_id uuid FK customers,
  label text,
  recipient_name text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  postal_code text NOT NULL,
  country char(2) DEFAULT 'ES',
  phone text,
  is_default boolean DEFAULT false,
  created_at, updated_at
)
```

RLS: `customer_id` = perfil del usuario autenticado. Máximo 20 direcciones por cliente v1.

**Alternativa:** JSON array en `customers` — peor para RLS y listados.

### 5. Segmento y portes

**Decisión:** `resolveCheckoutSegment(ctx)` → `b2b` si `validated_at` y `customer_group` 2–4; else `b2c`. Portes: reutilizar `SHIPPING_RULES[segment]`; subtotal para umbral = suma líneas tras cupón demo (misma lógica que `/cart`). B2C copy exacto en UI cuando `shippingCost > 0`: `Gastos de envío: 5,00 € (IVA incluido)`.

**Alternativa:** Toggle manual en checkout — inconsistente con sesión B2B.

### 6. Forma de pago RF-014

**Decisión:** Extender `CustomerContext` con `defaultPaymentMethod`. B2C: radio group `card | bizum | paypal | transfer` (sin integración). B2B: `PaymentMethodReadOnly` muestra string ERP; submit no abre pasarela. Campo persistido en order `paymentMethodLabel` + `paymentMethodCode` stub.

**Alternativa:** Leer Avansuite en tiempo real — requiere adaptador #36; v1 DB.

### 7. Creación de pedido Payload

**Decisión:** Server route con `PAYLOAD_API_URL` + API key; payload mínimo: líneas (sku, qty, unit prices, `ivaRateSnapshot` vacío hasta confirm), `origin`, `status`, `customerId` uuid, shipping fields, `orderNumber` generado en hook existente. No escribir en Supabase `orders` table.

**Alternativa:** Solo Supabase — contradice arquitectura OMS en CMS.

### 8. Invitado B2C

**Decisión:** Email obligatorio en paso 1 si no hay sesión; `place-order` guarda `guestEmail` en order. Login opcional CTA; no crear cuenta automática.

### 9. Cupón demo

**Decisión:** Misma tabla hardcoded que `/cart`; pasar código vía `sessionStorage` al entrar checkout; servidor revalida en `prepare`.

### 10. UI y tokens

**Decisión:** Componentes nuevos bajo `components/checkout/` usando `Button`, `Card`, `Input`, `RadioGroup` existentes; sin hex nuevos. Layout shop con breadcrumb Carrito → Checkout.

## Risks / Trade-offs

- **[Manipulación de totales]** → Recalcular precios y portes en servidor en `prepare` y `place-order`; ignorar totales cliente excepto cupón validado.
- **[Payload REST latencia]** → Timeout 5s; respuesta 503 con retry message; no vaciar carrito.
- **[Doble fuente direcciones]** → Facturación en `customers`; envío en `customer_addresses`; documentar en UI.
- **[B2B en tienda pública]** → Checkout accesible con sesión B2B; pago diferido sin Redsys puede confundir QA — copy explícito "Confirmación sujeta a condiciones de pago acordadas".
- **[Plantilla CMS obsoleta]** → No borrar en este cambio; añadir comentario deprecación en README cms.

## Migration Plan

1. Migración `customer_addresses` + regenerate `@jeyjo/database-types`.
2. Extender Payload `orders` fields + migración CMS.
3. Implementar APIs y UI checkout detrás de `CHECKOUT_ENABLED=true` (default true en dev).
4. Habilitar CTAs carrito; smoke tests CA-CHECKOUT-001/002/006.
5. Rollback: flag `CHECKOUT_ENABLED=false` restaura CTAs deshabilitados.

## Open Questions

- ¿Checkout B2B solo desde `/intranet` o también `/checkout` shop? **v1:** misma ruta `/checkout` con segmento B2B; intranet enlaza "Tramitar" al mismo endpoint.
- ¿Recogida en tienda exenta siempre de portes? **v1:** sí, `shippingCost = 0`.
- ¿Observaciones máximo caracteres? **v1:** 500.
