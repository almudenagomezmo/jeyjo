## Why

El cambio #10 (`plp-faceted-listing`) conectó listados y vista rápida al catálogo CMS, motor de precios (#6) y semáforo de stock (#8), pero la PDP en `/p/[id]` sigue renderizando desde `lib/data/products.ts` con precios stub, stock numérico local y productos relacionados heurísticos. El ROADMAP marca #11 como siguiente paso obligatorio: sin ficha enriquecida (**RF-012**, **RF-008**, **US-03**) no se puede avanzar a carrito/minicart (#12), home segmentada (#15) ni analytics de producto (#34).

## What Changes

- **PDP desde CMS:** resolver producto publicado por slug o SKU vía Payload REST (servidor), sustituyendo `getProduct` / `generateStaticParams` demo en `(shop)/p/[id]`.
- **Galería e imágenes:** mostrar imagen resuelta (`ownImage` > `providerImageUrl`) con fallback glyph; thumbnails reutilizan la misma fuente hasta imágenes dual PIM (#21).
- **Descripción y SEO:** `longDescription` (Lexical/HTML), `metaDescription` y breadcrumbs desde categorías CMS; metadata Next.js desde campos enrichment.
- **Atributos técnicos:** tabla de especificaciones desde campos ERP/enrichment (marca, REF, OEM, EAN, envase, IVA, categoría) más atributos técnicos configurables si existen en Payload.
- **Precios dinámicos RF-011:** `ProductBuyBox` consume `PriceQuote` del motor #6 (servidor + hidratación cliente) con presentación dual según toggle cabecera.
- **Stock semáforo RF-005:** badge desde `getStockIndicator` / CMS `stockIndicator`; sin cantidades numéricas; mensaje de pedido sin stock cuando `allowOrderWithoutStock` (**US-03 CA4**).
- **Envase cerrado RF-008:** `QtyStepper` con step/min = `packUnit`; ajuste automático al múltiplo superior con aviso visible al introducir cantidad inválida (**US-03 CA2**).
- **Añadir al carrito US-03:** botón habilitado según stock/flag; actualiza mini-carrito (#12 prepara wiring; en esta change se valida flujo desde PDP).
- **Cross-selling RF-012:** módulo "Productos relacionados" desde relación `relatedProducts` en CMS (productos publicados, no wildcard), con precios/stock resueltos como en PLP.
- **Adjuntos descargables:** listar manuales/fichas técnicas desde campo de attachments en producto (si vacío, sección oculta).
- **404 y visibilidad RF-006:** slug de wildcard o borrador → `notFound()`; redirección canónica slug preferido sobre SKU en URL.

## Capabilities

### New Capabilities

- `storefront-pdp-product-detail`: Ficha de producto enriquecida en `/p/[slug]` con galería, descripción larga, especificaciones, precios dual, stock semáforo, envase cerrado, add-to-cart, adjuntos y cross-selling configurable.

### Modified Capabilities

- `storefront-catalog-read`: Ampliar lectura single-product a snapshot PDP completo (slug lookup, enrichment, relatedProducts, attachments, categorías, imagen resuelta).
- `storefront-price-resolution`: Requisito de precio resuelto en PDP (servidor prefetch + API `/api/pricing/resolve` para refresco cliente).
- `storefront-stock-read`: Requisito de indicador en buy box PDP, reglas de habilitación add-to-cart con `allowOrderWithoutStock`, y aviso US-03 CA4.

## Impact

- `apps/storefront`: `(shop)/p/[id]/page.tsx`, `ProductBuyBox`, `ProductTabs`, `ProductImage`, nuevo `ProductGallery` / `ProductAttachments`, `lib/catalog/fetch-product-by-sku.ts` (ampliar snapshot), loader PDP servidor, mapper CMS→view-model.
- `apps/cms`: verificar campos `relatedProducts`, `longDescription`, attachments; seed QA en `jeyjo-catalog` si faltan datos de prueba.
- APIs existentes: `/api/pricing/resolve`, `/api/stock/[sku]`; sin cambios de contrato salvo consumo desde PDP.
- Paquetes: `@jeyjo/pricing`, `@jeyjo/stock-ports`.
- Desbloquea ROADMAP #12 (`cart-minicart-client`), #15, #34.
- Depende de #6, #8, #10 (completados). Alineado a alcance §1.8, **RF-012**, **RF-008**, **RF-011**, **US-03**.

## Non-Goals

- Mini-carrito completo y persistencia carrito (#12); solo validar que add-to-cart desde PDP dispara el store existente.
- Comparativa de productos (**US-06**, #38).
- Imágenes dual-source avanzadas y galería multi-imagen real (#21); v1 = imagen principal + placeholders de miniaturas.
- Auth B2B automática y precios por sesión real (#16); toggle manual cabecera se mantiene.
- Breadcrumbs dinámicos desde árbol navegación si categoría múltiple — usar categoría primaria del producto.
- Reviews/valoraciones reales (mantener placeholder o ocultar si CMS no tiene dato).
- Structured data JSON-LD / Merchant feed (#34).
