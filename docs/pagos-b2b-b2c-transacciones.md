# Pagos B2B / B2C y transacciones — Jeyjo

Documento de referencia sobre el funcionamiento **actual** del checkout, las pasarelas de pago y el registro de transacciones en el monorepo Jeyjo.

**Última revisión:** 2026-06-10  
**Código principal:** `apps/storefront/src/lib/payments/`, `apps/storefront/src/app/api/checkout/`, `apps/cms/src/collections/Orders/`

---

## Índice

1. [Segmento B2B vs B2C](#1-segmento-b2b-vs-b2c)
2. [Flujo general de checkout](#2-flujo-general-de-checkout)
3. [Pago B2C](#3-pago-b2c)
4. [Pago B2B](#4-pago-b2b)
5. [Transacciones y persistencia](#5-transacciones-y-persistencia)
6. [Ciclo de estados del pedido](#6-ciclo-de-estados-del-pedido)
7. [Configuración y variables de entorno](#7-configuración-y-variables-de-entorno)
8. [Rutas API relevantes](#8-rutas-api-relevantes)
9. [Resumen comparativo](#9-resumen-comparativo)
10. [Limitaciones actuales](#10-limitaciones-actuales)

---

## 1. Segmento B2B vs B2C

El segmento de checkout **no depende solo de estar logueado**, sino del **grupo de precios** del cliente autenticado.

| Segmento | Condición |
|----------|-----------|
| **B2B** | Usuario autenticado con `pricingCustomerGroup` entre 2 y 4 (cliente validado) |
| **B2C** | Invitado, usuario no validado, o cualquier otro caso |

Implementación: `apps/storefront/src/lib/checkout/segment.ts`

```ts
export function resolveCheckoutSegment(ctx: CustomerContext | null): CheckoutSegment {
  const group = pricingCustomerGroup(ctx)
  if (group >= 2 && group <= 4) return 'b2b'
  return 'b2c'
}
```

Al crear el pedido, el campo `origin` en Payload queda como `'b2b'` o `'b2c'`.

---

## 2. Flujo general de checkout

```
Carrito + prepare token
        │
        ▼
   ¿Segmento?
   ┌────┴────┐
   │         │
  B2C       B2B
   │         │
Elige      Muestra forma de pago
forma      acordada (solo lectura)
de pago         │
   │         │
   └────┬────┘
        ▼
 POST /api/checkout/place-order
        │
        ▼
 Crea pedido en Payload CMS
        │
   ┌────┴────────────────────────┐
   │                             │
 B2C + PAYMENTS_ENABLED=true    B2B
   │                             │
 resolvePaymentNextStep          Sin pasarela
 (Redsys / PayPal / transfer)    → confirmación directa
```

### Pasos técnicos

1. **Prepare** — `POST /api/checkout/prepare`  
   Calcula totales, líneas, cupón, etc. y devuelve un token firmado (`prepareToken`).

2. **Place order** — `POST /api/checkout/place-order`  
   Valida el token, determina segmento, crea el pedido en Payload.

3. **B2C** — Si `PAYMENTS_ENABLED=true`, la respuesta incluye `nextStep` para redirigir al TPV o mostrar instrucciones de transferencia.

4. **B2B** — No hay pasarela; el cliente va directo a `/checkout/confirmacion`.

---

## 3. Pago B2C

### 3.1 Métodos disponibles

Configurables en el CMS (global **`paymentSettings`**, label «Pagos (B2C)»), solo para clientes B2C:

| Código | Etiqueta UI | Pasarela (`gateway`) |
|--------|-------------|----------------------|
| `card` | Tarjeta | `redsys` |
| `bizum` | Bizum | `redsys` |
| `paypal` | PayPal | `paypal` |
| `transfer` | Transferencia bancaria | `transfer` |
| `apple_pay` | Apple Pay | `redsys` (parcial) |
| `google_pay` | Google Pay | `redsys` (parcial) |

- CMS: `apps/cms/src/globals/PaymentSettings.ts`
- Storefront: `apps/storefront/src/lib/payments/settings.ts`
- Listado en checkout: `GET /api/payments/methods`

El checkout filtra los métodos según los flags del CMS. En el paso «Revisión», el usuario B2C elige forma de pago mediante radios.

### 3.2 Estado inicial del pedido (B2C)

Al confirmar un pedido B2C:

| Campo | Valor |
|-------|-------|
| `jeyjoStatus` | `pending_payment` |
| `paymentStatus` | `pending` |
| `gateway` | `redsys`, `paypal` o `transfer` según método |

Implementación: `apps/storefront/src/lib/checkout/payload-order.ts`

### 3.3 Orquestador de pagos

Tras `place-order`, si el segmento es B2C y los pagos están activos, se llama a `resolvePaymentNextStep` (`apps/storefront/src/lib/payments/orchestrator.ts`):

| Método | `nextStep.type` | Acción |
|--------|-----------------|--------|
| `card`, `bizum` | `redirect` (form) | Auto-submit POST firmado al TPV Redsys |
| `paypal` | `redirect` (url) | Redirect a `/api/payments/paypal/create?orderId=…` |
| `transfer` | `instructions` | Redirect a `/checkout/transferencia?order=…` |
| `apple_pay`, `google_pay` | `wallet` | Hoy muestra error (InSite no configurado) |

El cliente (`CheckoutPage.tsx`) procesa `nextStep`: envía el formulario Redsys, redirige a PayPal, o navega a la página de transferencia.

### 3.4 Tarjeta y Bizum (Redsys)

```
place-order → formulario firmado → TPV Redsys
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
            POST /notify          POST /return-ok     POST /return-ko
            (webhook servidor)    (redirect usuario)  (redirect usuario)
                    │                   │                   │
                    └───────────┬───────┘                   │
                                ▼                           │
                    processRedsysNotification               │
                    (firma + idempotencia)                  │
                                │                           │
                    Actualiza pedido en Payload             │
                                │                           │
                    confirmacion?paid=1              Reintento vía
                                                     /api/payments/redsys/init
```

**Autorización correcta** (`Ds_Response` 0000–0099):

- `jeyjoStatus` → `confirmed`
- `paymentStatus` → `authorized`
- Se guardan: `gatewayAuthCode`, `gatewayTransactionId`, `paidAmount`, `paidAt`

**Pago denegado:**

- `paymentStatus` → `failed`
- `paymentFailureReason` → descripción del código Redsys

Archivos clave:

- `apps/storefront/src/lib/payments/redsys/process-notification.ts`
- `apps/storefront/src/app/api/payments/redsys/notify/route.ts`
- `apps/storefront/src/app/api/payments/redsys/return-ok/route.ts`
- `apps/storefront/src/app/api/payments/redsys/return-ko/route.ts`

### 3.5 PayPal

1. Redirect a PayPal para aprobación del usuario.
2. Vuelta a `/checkout/retorno/paypal?order=…&token=…`
3. `POST /api/payments/paypal/capture` captura el pago.
4. Actualiza el pedido: `jeyjoStatus: confirmed`, `paymentStatus: authorized`, `gateway: paypal`, `gatewayTransactionId: captureId`.

### 3.6 Transferencia bancaria

1. Redirect a `/checkout/transferencia?order=…`
2. Muestra IBAN, beneficiario y concepto (plantilla `{orderNumber}` desde CMS).
3. El pedido permanece en **`pending_payment`**.
4. La confirmación es **manual** por staff en el OMS (no hay webhook bancario).

Página: `apps/storefront/src/app/checkout/transferencia/page.tsx`

### 3.7 Apple Pay / Google Pay

- Aparecen en UI si `applePayEnabled` / `googlePayEnabled` en CMS.
- Tras `place-order` con `nextStep.type === 'wallet'`, el checkout muestra error indicando que requieren configuración InSite en Redsys.

---

## 4. Pago B2B

En B2B **no hay pasarela ni cobro online inmediato**.

### 4.1 UI en checkout

- Muestra la forma de pago acordada del cliente (`defaultPaymentMethod`), p. ej. «Giro a 30 días».
- Texto informativo: no se ofrecen pasarelas inmediatas en pedidos B2B.
- El usuario **no puede** elegir tarjeta, Bizum, PayPal, etc.

Componente: `apps/storefront/src/components/checkout/CheckoutPage.tsx` (bloque `segment === "b2b"`).

### 4.2 Datos del pedido (B2B)

| Campo | Valor |
|-------|-------|
| `paymentMethodCode` | `erp_default` |
| `paymentMethodLabel` | `defaultPaymentMethod` del cliente o «Condiciones acordadas» |
| `gateway` | `erp` |
| `paymentStatus` | No se establece (sin cobro online) |

### 4.3 Estado inicial según rol

| Caso | `jeyjoStatus` inicial |
|------|------------------------|
| Superadmin / titular de empresa | `pending_confirmation` |
| Subusuario con `ordersRequireApproval: true` | `pending_company_approval` |

Lógica en `apps/storefront/src/app/api/checkout/place-order/route.ts`:

```ts
const needsCompanyApproval = segment === 'b2b' && ctx && requiresOrderCompanyApproval(ctx)
const jeyjoStatus =
  segment === 'b2b'
    ? needsCompanyApproval
      ? 'pending_company_approval'
      : 'pending_confirmation'
    : 'pending_payment'
```

`requiresOrderCompanyApproval` solo aplica a subusuarios B2B con el flag `ordersRequireApproval` en sus permisos (`apps/storefront/src/lib/b2b/permissions.ts`).

### 4.4 Aprobación interna B2B

Para subusuarios que requieren aprobación:

1. Pedido queda en `pending_company_approval` (con `submittedByUserId` y `submittedByEmail`).
2. Superadmin/titular **aprueba** → `pending_confirmation` (`approveCompanyOrder`).
3. Superadmin/titular **rechaza** → `cancelled` (`rejectCompanyOrder`).
4. Staff en OMS confirma → `confirmed`.

Implementación: `apps/storefront/src/lib/intranet/order-approvals.ts`

El cobro real se gestiona por **condiciones ERP** (giro, factura, etc.), no por Redsys/PayPal.

---

## 5. Transacciones y persistencia

Hay **tres capas** relacionadas con pagos; solo dos se usan activamente en checkout.

### 5.1 Campos de pago en el pedido (Payload `orders`) — fuente principal

Cada pedido almacena la transacción de pago en campos propios del documento:

| Campo | Valores / uso |
|-------|----------------|
| `paymentStatus` | `pending`, `authorized`, `failed`, `cancelled` |
| `gateway` | `redsys`, `paypal`, `transfer`, `erp` |
| `gatewayTransactionId` | ID de transacción en PayPal o Redsys |
| `gatewayAuthCode` | Código de autorización Redsys |
| `paidAmount` | Importe cobrado (€) |
| `paidAt` | Fecha/hora del cobro |
| `paymentFailureReason` | Motivo si el pago falla |
| `paymentMethodCode` | Código del método (p. ej. `card`, `erp_default`) |
| `paymentMethodLabel` | Etiqueta legible para el cliente |

Definición CMS: `apps/cms/src/collections/Orders/index.ts` (grupo colapsable «Pago»).

Actualización desde storefront: `updateOrderPaymentStatus()` en `apps/storefront/src/lib/payments/payload-orders.ts` → `PATCH /api/orders/{id}`.

### 5.2 Tabla `payment_notifications` (Supabase) — auditoría Redsys

Migración: `supabase/migrations/20250604130000_payment_notifications.sql`

Solo para **notificaciones webhook de Redsys**:

| Columna | Uso |
|---------|-----|
| `order_reference` | Número de pedido |
| `signature` | Firma Redsys (índice único → idempotencia) |
| `gateway` | Por defecto `redsys` |
| `response_code` | Código `Ds_Response` |
| `raw_parameters` | JSON con parámetros decodificados |

Flujo:

1. Llega notificación a `/api/payments/redsys/notify`.
2. Se verifica firma HMAC.
3. Se inserta en `payment_notifications` (si la firma ya existe → `duplicate`, no se reprocesa).
4. Se actualiza el pedido en Payload.

Implementación: `apps/storefront/src/lib/payments/notifications.ts`, `process-notification.ts`.

### 5.3 Colección `transactions` (plugin ecommerce Payload) — no usada en checkout

Existe por el plugin `@payloadcms/plugin-ecommerce` (`status: pending | succeeded | failed | …`), pero **el storefront no crea ni actualiza registros en `transactions`** durante el flujo de checkout actual.

El pago se modela exclusivamente en los campos del pedido (`orders`) y, para Redsys, en `payment_notifications`.

---

## 6. Ciclo de estados del pedido

Estados Jeyjo (`jeyjoStatus`):

| Estado | Significado |
|--------|-------------|
| `pending_payment` | B2C: esperando pago (TPV o transferencia) |
| `pending_company_approval` | B2B: subusuario esperando aprobación interna |
| `pending_confirmation` | B2B: esperando confirmación staff |
| `confirmed` | Pedido confirmado |
| `preparing` | En preparación |
| `shipped` | Enviado |
| `delivered` | Entregado |
| `cancelled` | Cancelado |

### Transiciones automáticas (storefront / pasarelas)

| Desde | Hacia | Disparador |
|-------|-------|------------|
| `pending_payment` | `confirmed` | Redsys o PayPal autorizan |
| `pending_company_approval` | `pending_confirmation` | Aprobación empresa (B2B) |
| `pending_company_approval` | `cancelled` | Rechazo empresa (B2B) |

### Transiciones manuales (staff OMS)

| Desde | Hacia | Caso |
|-------|-------|------|
| `pending_payment` | `confirmed` | Transferencia B2C confirmada manualmente |
| `pending_confirmation` | `confirmed` | Pedido B2B confirmado por administración |
| Cualquier estado activo | `cancelled` | Cancelación staff |

Reglas: `apps/cms/src/collections/Orders/status-transitions.ts`

---

## 7. Configuración y variables de entorno

### Flag principal

```env
PAYMENTS_ENABLED=true
```

Definido en `apps/storefront/src/lib/payments/enabled.ts`. Si es `false`:

- B2C crea el pedido en `pending_payment`.
- No se devuelve `nextStep` (sin redirect a pasarela).

### Redsys

Variables en `apps/storefront/.env` (ver `.env.example`):

- `REDSYS_ENV` — `test` o `prod`
- `REDSYS_MERCHANT_CODE`, `REDSYS_TERMINAL`, `REDSYS_SECRET_KEY`
- URLs de retorno configuradas hacia el storefront

### PayPal

- Credenciales sandbox/producción en `.env` del storefront.
- `NEXT_PUBLIC_STOREFRONT_URL` necesaria para URLs de retorno.

### CMS — métodos B2C

Global **`paymentSettings`** en Payload admin (grupo «Configuración del sistema»):

- Toggles: tarjeta, Bizum, PayPal, transferencia, Apple Pay, Google Pay.
- Instrucciones de transferencia: IBAN, beneficiario, plantilla de concepto.

Solo roles `superadmin` y `administracion` pueden editar.

### Secretos compartidos

| Variable | Uso |
|----------|-----|
| `STOREFRONT_PAYLOAD_API_KEY` | Storefront → crear/actualizar pedidos en Payload |
| `CMS_INTERNAL_URL` / `CMS_URL` | URL del CMS para APIs server-side |

Ver también: `CONFIGURACION.md` §3.4.

---

## 8. Rutas API relevantes

### Checkout

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/checkout/prepare` | POST | Calcula totales y genera `prepareToken` |
| `/api/checkout/place-order` | POST | Crea pedido y devuelve `nextStep` (B2C) |

### Pagos B2C

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/payments/methods` | GET | Métodos habilitados según CMS |
| `/api/payments/redsys/init` | POST | Reinicia pago Redsys (reintento) |
| `/api/payments/redsys/notify` | POST | Webhook servidor Redsys |
| `/api/payments/redsys/return-ok` | POST | Redirect OK usuario |
| `/api/payments/redsys/return-ko` | POST | Redirect KO usuario |
| `/api/payments/redsys/reconcile` | GET | Cron: pedidos Redsys stale > 24 h |
| `/api/payments/paypal/create` | GET | Crea orden PayPal y redirige |
| `/api/payments/paypal/capture` | POST | Captura pago PayPal |

### Páginas storefront

| Ruta | Descripción |
|------|-------------|
| `/checkout` | Checkout multi-paso |
| `/checkout/transferencia` | Instrucciones IBAN (B2C transferencia) |
| `/checkout/confirmacion` | Resumen post-pedido |
| `/checkout/retorno/paypal` | Retorno PayPal + capture |
| `/checkout/retorno/ko` | Pago fallido + reintento Redsys |

---

## 9. Resumen comparativo

| Aspecto | B2C | B2B |
|---------|-----|-----|
| Elige forma de pago | Sí (según CMS) | No (solo lectura, del contrato) |
| Pasarelas online | Redsys, PayPal | Ninguna |
| Estado inicial | `pending_payment` | `pending_confirmation` o `pending_company_approval` |
| Cobro online | Sí (si `PAYMENTS_ENABLED=true`) | No (`gateway: erp`) |
| Confirmación final | Automática (TPV) o manual (transferencia) | Manual por staff / aprobación interna |
| Registro de transacción | Campos en `orders` + log Redsys en Supabase | Solo metadata ERP en el pedido |

---

## 10. Limitaciones actuales

1. **`PAYMENTS_ENABLED`** debe ser `true` para que B2C use pasarelas tras `place-order`.
2. **Transferencias B2C** no tienen confirmación bancaria automática; dependen de confirmación manual por staff.
3. **Apple Pay / Google Pay** están en UI pero no operativos del todo (requieren InSite Redsys).
4. **Reconciliación Redsys**: `GET /api/payments/redsys/reconcile` lista pedidos card/bizum en `pending_payment` > 24 h (endpoint pensado para cron).
5. **Analytics GA4**: evento `purchase` en confirmación cuando `paid=1` (pago autorizado) o según lógica del `PurchaseTracker`.
6. **Colección `transactions`** del plugin ecommerce no participa en el flujo de pagos custom de Jeyjo.

---

## Referencias OpenSpec

- `openspec/specs/storefront-checkout-shipping/spec.md` — RF-014 checkout y métodos de pago
- `openspec/specs/cms-payment-methods-config/spec.md` — configuración CMS
- `openspec/specs/payload-order-collection/spec.md` — campos de pago y estados
- Cambio archivado: `openspec/changes/archive/2026-06-04-payments-redsys-wallets/`
