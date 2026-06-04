## Context

- **Estado actual:** Checkout #17 crea pedidos Payload con `pending_payment` (B2C) o `pending_confirmation` (B2B). `place-order` persiste `paymentMethodCode` (`card`, `bizum`, `paypal`, `transfer`) sin cobro. Plantilla Payload en `apps/cms` conserva Stripe (deprecated). No hay vars Redsys en `.env.example`.
- **Requisitos:** **RF-014** (formas de pago B2C/B2B), **RI-006** (Redsys redirect + webhook), **CA-CHECKOUT-003** (tarjeta Redsys → pedido confirmado). Alcance §1.10: métodos activables desde backoffice.
- **Arquitectura:** Next.js storefront inicia pagos y recibe callbacks; Payload CMS es sistema de registro de pedidos; Supabase opcional para idempotencia de notificaciones.
- **Restricciones:** PCI — no persistir PAN/CVV; firma y secretos solo server-side; importe siempre recalculado desde prepare token.

## Goals / Non-Goals

**Goals:**

- Cobro B2C con tarjeta y Bizum vía Redsys TPV (redirect estándar RI-006).
- Apple Pay y Google Pay en checkout cuando Redsys y el dispositivo lo permiten.
- PayPal Checkout redirect (sandbox/prod) como método independiente de Redsys.
- Transferencia: instrucciones IBAN + referencia; pedido permanece `pending_payment`.
- Webhook Redsys idempotente que actualiza pedido a `confirmed` con referencia de autorización.
- Páginas retorno OK/KO con reintento de pago.
- Global Payload `paymentSettings` consumido por storefront para ocultar métodos desactivados.
- Tests unitarios de firma/parseo; guía E2E CA-CHECKOUT-003 en staging Redsys.

**Non-Goals:**

- Email confirmación (#28), bandeja OMS (#20), sync ERP.
- Stripe, tokenización propia, suscripciones, multi-FUC.
- Confirmación automática de transferencia (manual staff).
- 3DS UI custom más allá del TPV Redsys.

## Decisions

### 1. Módulo de pagos en storefront (`lib/payments/`)

**Decisión:** Paquete interno con adaptadores:

- `redsys/` — `buildRedirectForm`, `verifyNotification`, `signParameters`, tipos DS_*.
- `paypal/` — crear orden PayPal, capturar en return URL.
- `orchestrator.ts` — dado `orderId` + `paymentMethodCode`, devuelve `{ type: 'redirect' | 'instructions' | 'wallet', payload }`.

**Alternativa descartada:** Plugin Payload ecommerce payments — acoplado a Stripe; Jeyjo ya desactivó adapter en bootstrap.

### 2. Flujo post–place-order

**Decisión:** Secuencia:

1. Cliente confirma en `/checkout` → `POST place-order` (sin cambio de contrato base).
2. Respuesta ampliada: `{ orderNumber, orderId, status, nextStep: { type, url?, formFields? } }`.
3. B2C `card|bizum` → `POST /api/payments/redsys/init` genera form auto-submit hacia `sis-t.redsys.es` / prod.
4. B2C `apple_pay|google_pay` → InSite/REST Redsys: sesión en cliente, confirmación server-side.
5. B2C `paypal` → redirect PayPal approval URL.
6. B2C `transfer` → `/checkout/transferencia?order=…` con IBAN desde env/CMS global.
7. B2B → sin `nextStep` de pasarela; confirmación #17 intacta.

**Alternativa:** Cobrar antes de crear pedido — peor trazabilidad OMS; pedido sin referencia si abandono.

### 3. Firma Redsys HMAC SHA256

**Decisión:** Implementación pura Node (`crypto.createHmac`) siguiendo documentación Redsys v3: clave Base64 derivada, orden de campos para firma, `Ds_MerchantParameters` Base64 JSON. Env: `REDSYS_MERCHANT_CODE`, `REDSYS_TERMINAL`, `REDSYS_SECRET_KEY`, `REDSYS_ENV=test|prod`.

**Parámetros clave:** `Ds_Merchant_Order` = `orderNumber` (4–12 chars), `Ds_Merchant_Amount` céntimos, `Ds_Merchant_Currency=978`, `Ds_Merchant_MerchantURL` webhook, `Ds_Merchant_UrlOK` / `UrlKO`, `Ds_Merchant_PayMethods` (`T` tarjeta, `z` Bizum).

**Alternativa:** SDK npm no oficial — evitar dependencia opaca; lógica acotada ~200 LOC testeable.

### 4. Webhook y reconciliación

**Decisión:** `POST /api/payments/redsys/notify` (público, sin auth cookie):

1. Verificar firma respuesta.
2. Buscar pedido por `Ds_Order`.
3. Insertar fila en `payment_notifications` (Supabase) con `Ds_Signature` unique — skip si duplicado.
4. Si `Ds_Response` autorizado (códigos 0000–0099 según doc Redsys), PATCH Payload order → `status: confirmed`, `paymentStatus: authorized`, campos `redsysAuthCode`, `redsysResponseCode`, `paidAmount`, `paidAt`.
5. Responder HTTP 200 siempre tras persistir (evitar reintentos infinitos en error de negocio logueado).

**Reconciliación:** Cron Vercel `/api/payments/redsys/reconcile` (diario): pedidos `pending_payment` > 24h con método card/bizum consulta REST Redsys si disponible, o marca para revisión staff.

**Alternativa:** Webhook solo en CMS — storefront ya es borde público en arquitectura §4.

### 5. Wallets (Apple Pay / Google Pay)

**Decisión:** Redsys REST API / InSite v2:

- Storefront carga script Redsys InSite solo en checkout cuando `paymentSettings.applePayEnabled|googlePayEnabled` y `window.ApplePaySession` / Payment Request API disponible.
- Botones junto a radios existentes; al pulsar, flujo wallet → token Redsys → mismo endpoint notify con `Ds_Merchant_PayMethod` wallet.
- Merchant domain verification files en `public/.well-known/` (Apple) según doc Redsys.

**Alternativa:** Stripe Payment Element — fuera de stack acordado.

### 6. PayPal

**Decisión:** PayPal Checkout SDK server-side (`@paypal/checkout-server-sdk` o REST v2): crear orden con `reference_id = orderNumber`, return URL `/checkout/retorno/paypal`, webhook PayPal opcional v1 (confirmación en return + capture).

**Alternativa:** PayPal vía Redsys — depende de contrato comercio; PayPal directo desacopla.

### 7. Configuración backoffice

**Decisión:** Payload global `paymentSettings`:

```ts
{
  cardEnabled, bizumEnabled, paypalEnabled,
  applePayEnabled, googlePayEnabled, transferEnabled,
  transferInstructions: { iban, beneficiary, conceptTemplate }
}
```

Storefront: `GET /api/payments/methods` (cache 60s) filtra radios checkout. Staff edita en CMS Settings.

**Alternativa:** Hardcode env — no cumple alcance §1.10 activable sin deploy.

### 8. Campos Payload order

**Decisión:** Añadir grupo `payment`:

- `paymentStatus`: `pending` | `authorized` | `failed` | `cancelled`
- `gateway`: `redsys` | `paypal` | `transfer` | `erp`
- `gatewayTransactionId`, `gatewayAuthCode`, `paidAmount`, `paidAt`, `paymentFailureReason`

Transición: `pending_payment` + `paymentStatus pending` → pago OK → `status confirmed` + `paymentStatus authorized`. Email OMS diferido #20.

**Alternativa:** Tabla Supabase payments — duplicación; Payload es OMS v1.

### 9. Seguridad

**Decisión:** Secretos solo server; webhook valida firma; importe en init recalculado desde order Payload (no confiar query params); rate limit en `/api/payments/*/init`; CSRF no aplica a POST Redsys externo.

### 10. UI retorno

**Decisión:** `/checkout/retorno/ok?order=…` muestra confirmación (reutiliza confirmación #17 ampliada con estado pagado). `/checkout/retorno/ko?order=…` muestra error Redsys + botón "Reintentar pago" → re-init sin recrear pedido si sigue `pending_payment`.

## Risks / Trade-offs

- **[Webhook no llega en dev local]** → Túnel ngrok documentado; reconciliación cron; botón staff "Marcar pagado" fuera de scope (#20).
- **[Doble cobro por reintento]** → Mismo `orderNumber` en Redsys; idempotencia notify; init rechaza si `paymentStatus authorized`.
- **[Wallets no disponibles en staging]** → Feature flags; QA manual con tarjeta CA-CHECKOUT-003.
- **[PayPal + Redsys credenciales]** → Vars separadas; fallo parcial no bloquea otros métodos.
- **[Importe desincronizado]** → Init lee total desde Payload order creado en place-order; tolerancia 0 céntimos.

## Migration Plan

1. Migración Supabase `payment_notifications` + Payload global `paymentSettings` + campos order.
2. Implementar `lib/payments/redsys` + tests firma.
3. APIs init/notify + páginas retorno detrás de `PAYMENTS_ENABLED=true`.
4. Integrar wallets + PayPal.
5. Actualizar checkout UI: tras place-order, auto-redirigir según `nextStep`.
6. Staging: CA-CHECKOUT-003 con tarjeta prueba 4548812049400004.
7. Rollback: `PAYMENTS_ENABLED=false` → checkout vuelve a confirmación sin pasarela (#17 behavior).

## Open Questions

- ¿IBAN transferencia fijo en global CMS o por entorno env? **v1:** global CMS editable por staff.
- ¿PayPal webhook obligatorio en v1? **v1:** capture en return URL; webhook en hardening posterior.
- ¿Mostrar Apple Pay en desktop Safari only? **v1:** sí, detección runtime; ocultar si no soportado.
