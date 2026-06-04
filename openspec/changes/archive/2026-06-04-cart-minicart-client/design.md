## Context

- **Estado actual:** Existe scaffolding cliente: `useCartStore` (Zustand + persist `jeyjo-cart`), `useUiStore` (`miniCartOpen`, `priceMode`), `MiniCart` slide-over montado en `app/layout.tsx`, badge en `Header`, `AddToCartButton`, `/cart` con cupón demo. `buildCartSummary` resuelve productos vía `getProduct` de `lib/data/products.ts` (demo) y precios stub — no cumple integración real post-#11.
- **Alcance:** §1.3 mini-carrito flotante, **US-03 CA3**, preview **RF-013**, precios **RF-011** en líneas de carrito.
- **Dependencias ROADMAP:** #6 (`price-engine-core`), #11 (`pdp-product-detail`) completados. Bloquea #17 checkout, #23 historial, #24 pedido rápido.

## Goals / Non-Goals

**Goals:**

- Tipo `CartLine` persistente `{ productId: string; qty: number }` donde `productId` = slug o `skuErp` canónico usado en PLP/PDP.
- Hook `useCartSummary()` que: (1) lee líneas del store; (2) resuelve snapshots CMS batch para metadatos (título, ref, imagen, packUnit); (3) obtiene quotes vía `POST /api/pricing/batch`; (4) devuelve `CartSummary` con subtotal, portes preview y líneas detalladas.
- `MiniCart` consume `useCartSummary`; abre al add-to-cart (`openCart` default true); muestra loading skeleton mientras fetch; empty state; footer con subtotal, banner portes, CTAs `/cart`.
- `/cart` reutiliza mismo hook/summary; tabla ampliada; cupón UI stub; placeholder presupuesto.
- `AddToCartButton` / PLP card / quick-view / PDP buy box: tras `addItem`, abren mini-carrito y badge se actualiza sin navegación.
- Envase cerrado: `QtyStepper` con `step={packUnit}` en mini-carrito y `/cart`; wrapper `onInvalidQuantity` reutiliza patrón `PackQtyStepper` (US-03 CA2).
- Eliminar dependencia de `lib/data/products.ts` en `lib/cart.ts`; fallback: línea con label "Producto no disponible" si CMS no resuelve (permitir remove).

**Non-Goals:**

- Checkout, auth carrito servidor, presupuesto funcional, cupones reales, GA4, carritos abandonados, configuración portes en backoffice.

## Decisions

### 1. Identificador de línea: slug canónico

**Decisión:** `productId` en store = slug CMS preferido (mismo id que URLs `/p/{slug}` y cards PLP). Lookup CMS: batch por slugs con endpoint interno o reutilizar `fetchPublicProductList` filtrado.

**Alternativa descartada:** Guardar solo SKU — duplica lógica slug/SKU ya unificada en PDP.

### 2. Resolución producto + precio en cliente

**Decisión:** `useCartSummary` (client-only) ejecuta en `useEffect`/`useSWR`:
1. Extrae ids únicos de líneas.
2. `POST /api/pricing/batch` con SKUs resueltos del snapshot.
3. Fetch CMS: nuevo route `POST /api/catalog/cart-products` (server) que acepta slugs[], devuelve `{ id, slug, skuErp, name, ref, packUnit, imageUrl }[]` aplicando visibilidad pública — evita exponer Payload REST al cliente y permite cache 30s.

**Alternativa descartada:** Resolver todo en `buildCartSummary` síncrono con demo data — mantiene deuda #11.

**Alternativa descartada:** Server Component para mini-carrito — requiere cookies/session y rompe persist localStorage anónimo.

### 3. Estado UI mini-carrito

**Decisión:** `miniCartOpen` en `useUiStore` **sin persist** (solo `priceMode` persistido). Montaje global en root layout. Cierre: overlay click, botón X, Escape, `body overflow hidden` mientras abierto.

**Alternativa descartada:** URL hash `#cart` — innecesario para v1.

### 4. Apertura automática al añadir

**Decisión:** `AddToCartButton` prop `openCart?: boolean` default `true`. PLP quick-view y card inline add respetan mismo flag. PDP buy box usa `AddToCartButton` o llama `setMiniCartOpen(true)` tras add.

**Alternativa:** Toast sin abrir panel — peor UX vs US-03 CA3 explícito.

### 5. Cálculo portes preview RF-013

**Decisión:** Constantes en `lib/cart/shipping.ts`: `{ b2c: { threshold: 39, cost: 5 }, b2b: { threshold: 10, cost: 2.5 } }`. `shippingCost = subtotal >= threshold || subtotal === 0 ? 0 : cost`. Banner copy alineado a prototipo jeyjo-next.

**Alternativa:** Fetch reglas desde CMS — #42 system-config.

### 6. Hidratación y badge

**Decisión:** Mantener `useHydrated()` + `selectCartCount` selector Zustand. Badge oculto hasta hydrated; mini-carrito no renderiza panel hasta hydrated (evita mismatch SSR).

### 7. Merge de líneas duplicadas

**Decisión:** `addItem` incrementa qty si `productId` ya existe; no duplica filas.

### 8. Página `/cart`

**Decisión:** Client page (`"use client"`) compartiendo `useCartSummary`. Cupón hardcoded map (BLOG5, MAYO10) como demo hasta #31. CTA "Tramitar" → `/cart` anchor o disabled con tooltip "Checkout próximamente" hasta #17 — **preferir link `/cart#checkout` deshabilitado** con copy claro.

### 9. Accesibilidad mini-carrito

**Decisión:** `role="dialog"`, `aria-modal="true"`, focus trap ligero (focus primer control al abrir), `aria-label` en botones qty/remove. Overlay `aria-label="Cerrar carrito"`.

## Risks / Trade-offs

- **[Precios desactualizados en carrito]** → Batch refetch al abrir mini-carrito y al cambiar `priceMode`; debounce 300ms en qty changes.
- **[Producto despublicado en carrito]** → Mostrar línea orphan con mensaje y botón eliminar; no bloquear resto del carrito.
- **[Flash loading al abrir mini-carrito]** → Skeleton 2–3 filas; cache SWR 60s por conjunto de SKUs.
- **[localStorage quota]** → Límite práctico ~50 líneas; sin validación v1.
- **[Cupón demo confunde QA]** → Label "Demo" en UI cupón hasta #31.

## Migration Plan

1. Implementar `/api/catalog/cart-products` y `useCartSummary` detrás de feature flag `CART_USE_CMS=true` (default true en dev).
2. Sustituir `buildCartSummary` sync por hook async; mantener función pura `computeCartSummary(lines, products, quotes, mode)` testeable.
3. Verificar PLP/PDP/add flows manualmente; rollback flag revierte a demo summary si crítico.
4. No migración DB — solo localStorage cliente.

## Open Questions

- ¿CTA "Tramitar" en mini-carrito debe ir a `/cart` o quedar disabled hasta #17? **v1:** ambos botones van a `/cart`; checkout real en #17.
- ¿Persistir `miniCartOpen` entre recargas? **v1:** no.
