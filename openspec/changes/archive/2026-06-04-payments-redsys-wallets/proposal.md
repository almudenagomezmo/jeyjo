## Why

El checkout (#17) ya crea pedidos Payload en estado `pending_payment` con selección de forma de pago B2C (tarjeta, Bizum, PayPal, transferencia) sin cobro real, y B2B en `pending_confirmation` sin pasarelas. Sin **RI-006** (Redsys BBVA) y wallets (**RF-014**, alcance §1.10), el embudo B2C no puede completarse en producción (**CA-CHECKOUT-003** pendiente), el ROADMAP bloquea OMS (#20), presupuestos (#19) y emails de confirmación. Es el cambio #18 obligatorio tras checkout.

## What Changes

- **Flujo de pago B2C post–place-order:** Tras crear el pedido, métodos con pasarela (tarjeta, Bizum, Apple Pay, Google Pay) inician cobro vía Redsys; transferencia muestra instrucciones y mantiene `pending_payment`; PayPal usa integración dedicada (REST redirect) alineada a RF-014.
- **Redsys TPV (RI-006):** Firma HMAC SHA256, redirección al TPV virtual, URLs OK/KO, notificación online (webhook) y reconciliación periódica si falla el webhook.
- **Wallets:** Apple Pay y Google Pay expuestos en checkout cuando el navegador/dispositivo los soporta y el comercio está habilitado en Redsys; tokenización vía API REST/InSite Redsys (sin almacenar PAN en Jeyjo).
- **Actualización de pedido:** Tras pago autorizado, el pedido pasa a `confirmed` con referencia Redsys/PayPal, timestamp y snapshot de importe cobrado; denegado/cancelado vuelve a `pending_payment` con motivo visible al cliente.
- **B2B sin cambio funcional:** Validado B2B sigue sin pasarelas inmediatas (**CA-CHECKOUT-006**); confirmación manual/OMS en #20.
- **Configuración backoffice:** Global Payload `paymentSettings` (o equivalente) para activar/desactivar métodos B2C (alcance §1.10) sin redeploy.
- **Variables de entorno y documentación:** Credenciales Redsys (FUC, terminal, clave SHA256, entorno test/prod), PayPal client id/secret, URLs públicas de callback.
- **Tests:** Unit (firma Redsys, parseo webhook), integración (mock TPV), escenario manual/E2E **CA-CHECKOUT-003** en staging Redsys.

## Capabilities

### New Capabilities

- `storefront-redsys-payments`: Integración RI-006 — inicio de pago tarjeta/Bizum, redirección TPV, retorno OK/KO, webhook de notificación, reconciliación y transición de estado del pedido (**CA-CHECKOUT-003**).
- `storefront-wallet-payments`: Apple Pay y Google Pay en checkout B2C vía Redsys (detección de disponibilidad, botones wallet, confirmación unificada con el mismo webhook).
- `cms-payment-methods-config`: Configuración staff de métodos B2C activos (tarjeta, Bizum, PayPal, Apple Pay, Google Pay, transferencia) consumida por storefront.

### Modified Capabilities

- `storefront-checkout-shipping`: La selección B2C de forma de pago dispara flujo de cobro real (no solo persistencia de código); transferencia y PayPal tienen rutas post-confirmación definidas; invitado puede pagar tras place-order.
- `payload-order-collection`: Campos de transacción de pago (`paymentStatus`, referencias gateway, importe autorizado, fechas) y transición `pending_payment` → `confirmed` tras autorización.

## Impact

- `apps/storefront`: `lib/payments/**`, rutas `app/api/payments/**`, `app/checkout/pago/**`, `app/checkout/retorno/**`, componentes wallet y redirección; ampliación `place-order` para devolver URL de pago o siguiente paso.
- `apps/cms`: global/colección configuración pagos; hooks o endpoints internos para actualizar estado de pedido desde webhook (service key); posible tabla Supabase `payment_notifications` para idempotencia.
- `supabase/migrations`: opcional log de notificaciones Redsys (idempotencia, auditoría).
- `apps/storefront/.env.example`, `apps/cms/.env.example`: vars Redsys, PayPal, URLs callback.
- Tests en `apps/storefront/tests/payments/**`.
- Desbloquea ROADMAP #20 (`oms-pedidos-web`), #19 (`quotes-presupuesto-flow`), #28 (email confirmación parcial).
- Depende de #17 (`checkout-shipping-b2c-b2b`, completado).

## Non-Goals

- Email transaccional de confirmación de pedido (**#28** / RI-009); solo actualización de estado lista para OMS.
- Bandeja OMS operativa y sync ERP pedidos (**#20**).
- Cupones reales desde backoffice (**#31**); se mantiene demo BLOG5/MAYO10.
- Área documental, facturación electrónica (**#37**).
- Tokenización propia, vault PCI, suscripciones o pagos aplazados (financiación).
- 3D Secure custom UI más allá del flujo estándar Redsys.
- PayPal vaulting, pagos recurrentes.
- Configuración multi-FUC o multi-moneda.

## Assumptions

- Un único comercio Redsys (FUC + terminal) para B2C; entorno test (`sis-t.redsys.es`) en staging.
- Bizum se activa vía parámetros Redsys (`DS_MERCHANT_PAYMETHODS`), no pasarela Bizum independiente.
- Apple Pay / Google Pay requieren dominio verificado y merchant habilitado en panel Redsys; si no disponible en dev, botones ocultos con flag.
- PayPal Checkout v2 (redirect) con credenciales sandbox; no pasa por Redsys.
- Transferencia bancaria: pantalla con IBAN/referencia de pedido; estado `pending_payment` hasta confirmación manual staff (#20).
- Importe cobrado = total del prepare token validado en servidor (anti-tampering heredado de #17).
- Webhook Redsys llega a ruta pública HTTPS storefront (`/api/payments/redsys/notify`); en local se usa túnel o reconciliación manual.
