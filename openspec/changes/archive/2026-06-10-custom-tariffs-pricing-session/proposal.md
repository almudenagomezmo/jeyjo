## Why

Tras #25 (`custom-tariffs-view`) y #51 (`web-native-operations`), la vista `/cuenta/empresa/precios` no mostraba qué tarifa aplica realmente en tienda, el SSR de precios (PDP/PLP/home) ignoraba la sesión B2B (aplicaba ofertas de grupo en lugar de precios especiales), y los datos incoherentes en CMS generaban descuentos derivados absurdos.

## What Changes

- **Columna Tarifa en tienda:** precio neto vigente en catálogo/carrito vía `resolvePrice`; icono ℹ con tooltip cuando el pactado no aplica (caducado u otra regla RF-007).
- **Estado Vigente:** badge en rojo (`danger`) en la tabla de precios especiales.
- **SSR con sesión B2B:** PDP, PLP, home, búsqueda, comparador y mega-menú pasan `pricingCustomerId` al batch de precios (misma regla que `/api/pricing/*`).
- **Descuento derivado:** no mostrar % negativo cuando el neto pactado supera P2 recomendado.
- **Validación CMS:** precio especial no puede superar P2 del catálogo.
- **PDP:** eliminar badge textual «Oferta limitada»; la oferta se indica con precio tachado y fondo suave.
- **Motor:** etiqueta de oferta de grupo unificada como «Oferta de grupo».

## Capabilities

### Modified Capabilities

- `storefront-b2b-custom-tariffs`
- `storefront-price-resolution`
- `storefront-pdp-product-detail`
- `backoffice-b2b-pricing-admin`
- `pricing-engine`

## Impact

- `apps/storefront/src/lib/intranet/custom-tariffs/**`
- `apps/storefront/src/components/intranet/CustomTariffsPanel.tsx`
- `apps/storefront/src/lib/pdp/load-pdp-page.ts`, `lib/plp/load-plp-page.ts`, `lib/pricing/session-customer-id.ts`
- `apps/storefront/src/components/product/ProductBuyBox.tsx`
- `apps/cms/src/collections/SpecialPrices/index.ts`
- `packages/pricing/src/resolve-price.ts`

## Non-Goals

- Mostrar etiqueta de tipo de tarifa en columna Tarifa en tienda (solo importe).
- Restaurar badge «Oferta limitada» en PDP.
- Filtrar ofertas de grupo por `customer_group` en motor storefront (gap conocido).
