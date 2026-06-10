## Why

Tras el checkout base (#17) y cupones reales (#31), la UX de entrega, revisión y confirmación seguía siendo mínima: la línea de descuento no identificaba el cupón, las direcciones de envío se mostraban mezcladas con el selector de entrega, y `/checkout/confirmacion` solo listaba ítems GA4 sin estado, totales desglosados ni cupón. Además, vaciar el carrito antes de la redirección a confirmación provocaba un flash de redirección a `/cart`.

## What Changes

- **Descuento en checkout:** la columna de totales del paso revisión muestra código y etiqueta del cupón (`formatCheckoutDiscountLine`) cuando hay descuento aplicado.
- **Direcciones en entrega:** paso entrega con tarjeta separada **Dirección de envío** al elegir envío a facturación o dirección alternativa guardada; recogida en tienda mantiene flujo compacto en la tarjeta Entrega.
- **Confirmación de pedido:** `/checkout/confirmacion` carga el pedido Payload y muestra estado, entrega, forma de pago, cupón, tabla de líneas, subtotal/descuento/envío/total y observaciones.
- **Redirección post-place-order:** el carrito se vacía solo tras confirmar el siguiente paso (pasarela, instrucciones o confirmación), evitando redirección prematura a `/cart`.

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `storefront-checkout-shipping`: UX de direcciones en entrega, etiqueta de descuento con cupón, página de confirmación enriquecida y orden seguro de limpieza del carrito.

## Impact

- `apps/storefront/src/components/checkout/CheckoutPage.tsx`
- `apps/storefront/src/lib/checkout/totals.ts`
- `apps/storefront/src/lib/coupon/validate.ts`
- `apps/storefront/src/app/checkout/confirmacion/page.tsx`
- `apps/storefront/src/app/checkout/confirmacion/ConfirmacionClient.tsx`
- `apps/storefront/src/lib/orders/order-coupon-summary.ts`
- `apps/storefront/tests/order-coupon-summary.test.ts`

## Non-Goals

- Cambiar reglas RF-013 de envío ni validación de cupones (#31).
- Mostrar dirección completa en confirmación (solo etiqueta de método de entrega existente).
- Histórico de pedidos en cuenta (#56); `order-coupon-summary` se reutiliza allí pero no forma parte de este cambio.
