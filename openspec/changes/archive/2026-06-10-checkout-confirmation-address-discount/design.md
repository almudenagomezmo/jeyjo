## Context

- **#17** entregó checkout en dos pasos con métodos de entrega y confirmación mínima.
- **#31** integró cupones reales; la UI mostraba solo la palabra "Descuento" sin código ni tipo.
- El paso entrega mezclaba selector, dirección alternativa y observaciones en una sola tarjeta; envío a facturación no destacaba la dirección de envío.
- `place-order` vaciaba el carrito antes de `router.push` a confirmación; el `useEffect` de carrito vacío redirigía a `/cart`.

## Decisions

### 1. Etiqueta de descuento compartida

**Decisión:** `formatCheckoutDiscountLine(couponCode, couponLabel)` en `lib/coupon/validate.ts`, usada en checkout revisión y confirmación.

**Formato:** `Descuento (CODE · 5%)` o `Descuento (CODE)` si falta etiqueta CMS.

### 2. Tarjeta separada de dirección de envío

**Decisión:** Al seleccionar `home` o `alternate_address`, mostrar segunda tarjeta **Dirección de envío** con dirección de facturación o lista de `customer_addresses`, más observaciones y botón continuar.

**Recogida en tienda:** observaciones y continuar permanecen en tarjeta Entrega (sin segunda tarjeta).

### 3. Confirmación enriquecida server-side

**Decisión:** `page.tsx` resuelve pedido por `orderNumber`, parsea líneas, calcula subtotal y usa `resolveOrderCouponSummary` para descuento derivado de totales almacenados.

**Motivo:** Reutilizar etiquetas de estado/entrega existentes (`customer-order-labels`) y mantener GA4 `PurchaseTracker` sin cambiar contrato analytics.

### 4. Orden de limpieza del carrito

**Decisión:** `orderPlacedRef` evita redirect a `/cart` mientras se navega; `clearCart()` se ejecuta justo antes de cada salida (redirect pasarela, instrucciones, confirmación).

## Risks

- **Descuento derivado:** si totales del pedido no cuadran con subtotal+envío, el descuento mostrado puede ser 0 — aceptable; el cupón sigue visible por código.
- **Confirmación sin auth:** la página sigue siendo pública por número de pedido (comportamiento previo).
