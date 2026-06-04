## Why

El cambio #11 (`pdp-product-detail`) conectó la ficha de producto al catálogo CMS, motor de precios (#6) y semáforo de stock (#8), y el storefront ya dispone de piezas parciales (Zustand `cart-store`, `MiniCart`, `/cart`, badge en cabecera). Sin embargo, el carrito sigue resolviendo líneas con `getProduct` demo y precios stub, incumpliendo **US-03 CA3** (mini-carrito actualizado al instante con subtotal real) y el alcance §1.3 (mini-carrito flotante con acceso al checkout). El ROADMAP marca #12 como siguiente paso obligatorio: sin carrito cliente sólido no se puede avanzar a checkout (#17), historial repetible (#23) ni pedido rápido (#24).

## What Changes

- **Store cliente persistente:** Zustand + `localStorage` para líneas `{ productId/sku, qty }`; acciones `addItem`, `setQty`, `removeItem`, `clear`; selector de contador para badge cabecera.
- **Mini-carrito lateral:** panel slide-over desde icono cabecera; lista de líneas con imagen, nombre, REF, `QtyStepper` con step = `packUnit`, subtotal por línea, eliminar; estado vacío con CTA catálogo; cierre con overlay, Escape y bloqueo scroll.
- **US-03 CA3:** al añadir desde PDP, PLP (tarjeta / quick-view) o botón reutilizable, el mini-carrito se abre (configurable) y refleja inmediatamente la nueva línea y subtotal.
- **Precios reales RF-011:** resolver precios de líneas vía `/api/pricing/batch` (motor #6) según modo B2C/B2B de cabecera; subtotal coherente con dual-price helpers existentes.
- **Vista previa portes RF-013:** banner envío gratis / importe restante (umbrales B2C 39€ / B2B 10€ v1 hardcoded como en prototipo; configuración backend en #42).
- **Página `/cart`:** carrito completo reutilizando `buildCartSummary`; tabla de líneas, cupón demo (stub hasta #31), totales, CTAs "Tramitar" y enlace presupuesto placeholder (US-05 en #19).
- **Envase cerrado en carrito:** `QtyStepper` en mini-carrito y `/cart` respeta `packUnit`; ajuste al múltiplo superior con aviso US-03 CA2.
- **Hidratación SSR-safe:** badge y mini-carrito no parpadean gracias a `useHydrated`; persistencia no rompe SSR.
- **Resolución producto CMS:** sustituir `getProduct` demo en `buildCartSummary` por fetch batch de snapshots CMS (slug/sku, título, imagen, packUnit) con fallback graceful si producto ya no publicado.

## Capabilities

### New Capabilities

- `storefront-cart-minicart`: Carrito cliente persistente, mini-carrito flotante en cabecera, página `/cart`, integración add-to-cart desde PLP/PDP, precios batch y vista previa de portes (US-03 CA3, alcance §1.3, RF-011 parcial, RF-013 preview).

### Modified Capabilities

- `storefront-shell-navigation`: Requisito de badge numérico hidratado y montaje global de `MiniCart` en layout; botón carrito abre panel lateral.
- `storefront-plp-faceted`: Requisito de que add-to-cart desde tarjeta y quick-view actualice mini-carrito (US-03 CA3).
- `storefront-pdp-product-detail`: Requisito explícito US-03 CA3 — add-to-cart abre/actualiza mini-carrito con subtotal.

## Impact

- `apps/storefront`: `lib/store/cart-store.ts`, `lib/store/ui-store.ts`, `lib/cart.ts`, `components/cart/MiniCart.tsx`, `AddToCartButton.tsx`, `app/cart/page.tsx`, `components/layout/Header.tsx`, `app/layout.tsx`; posible `lib/cart/fetch-cart-products.ts` y hook `useCartSummary`.
- APIs existentes: `/api/pricing/batch` (consumo cliente); sin nuevos endpoints de servidor obligatorios.
- Paquetes: `@jeyjo/pricing` (modo B2B/B2C en batch response).
- Desbloquea ROADMAP #17 (`checkout-shipping-b2c-b2b`), #23, #24, #31.
- Depende de #6 (`price-engine-core`) y #11 (`pdp-product-detail`) — completados.

## Non-Goals

- Checkout, direcciones, pasarela Redsys (#17–#18).
- Cupones reales y motor marketing (#31); cupón demo en `/cart` solo como placeholder UI.
- Botón "Solicitar presupuesto" funcional (#19); solo placeholder deshabilitado o enlace stub.
- Sincronización carrito servidor / usuario autenticado (#16).
- GA4 `add_to_cart` events (#34).
- Recuperación carritos abandonados (#31).
- Quick-order Excel (#24).
- Umbrales portes configurables desde backoffice (#42) — v1 constantes en código alineadas a RF-013.
