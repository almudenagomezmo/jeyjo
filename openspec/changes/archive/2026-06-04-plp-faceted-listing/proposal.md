## Why

El cambio #9 (`storefront-shell-navigation`) dejó rutas PLP en `/c/[category]/[sub]` con `ProductCatalog` sobre datos demo (`lib/data/products.ts`), filtros parciales (marca, precio máximo, eco, ofertas) y precios derivados del stub local, no del motor #6 ni del catálogo CMS #7. El ROADMAP marca #10 como siguiente paso obligatorio: sin PLP facetada alineada a **RF-010** y precios dual en tarjetas (**RF-011**, **US-02**) no se puede avanzar a PDP enriquecida (#11), home segmentada (#15) ni comparativa (#38).

## What Changes

- **Listado desde CMS:** servidor en storefront que lista productos publicados por categoría/slug (Payload REST + filtros de visibilidad RF-006), sustituyendo `getProductsByCategory` demo en páginas `/c/*` y `/search`.
- **Facetas RF-010:** panel lateral con filtros acumulables: marca/fabricante (supplier), color, material, rango de precio (sobre precio resuelto P1), disponibilidad "En stock para envío hoy" (semáforo `available`), eco-label, categoría/subcategoría contextual; cada faceta muestra recuento de resultados **antes** de aplicar el filtro.
- **Estado en URL:** filtros y ordenación serializados en query string (`?brand=…&color=…&sort=price-asc`) para compartir y refrescar sin perder contexto.
- **Precios en PLP:** `ProductCard` y vista rápida usan `PriceQuote` vía API servidor (#6) y presentación dual **RF-011**; respeto del toggle cabecera (B2C/B2B manual hasta #16).
- **Stock en PLP:** badge semáforo desde `stockIndicator` CMS (#8), etiqueta "En stock para envío hoy" cuando nivel `available`.
- **Tarjeta de producto:** vista rápida (modal/drawer), añadir al carrito con múltiplos de `packUnit` (CA-PRECIOS-005 base), wishlist existente.
- **Ordenación:** relevancia (por defecto en categoría), precio asc/desc, nombre, valoración (si dato presente).
- **Página búsqueda:** misma experiencia PLP cuando hay `q`, reutilizando facetas sobre conjunto filtrado por texto (búsqueda demo/estática hasta #14).

## Capabilities

### New Capabilities

- `storefront-plp-faceted`: Listado facetado en categoría, subcategoría y búsqueda; agregación de facetas, URL state, vista rápida y add-to-cart desde PLP.

### Modified Capabilities

- `storefront-catalog-read`: Ampliar de resolución de precio por SKU a listado paginado/filtrado de productos públicos por categoría y búsqueda.
- `storefront-price-resolution`: Requisito de precios resueltos por lote en PLP (batch o N+1 acotado) sin exponer P2 a anónimos.
- `storefront-stock-read`: Exponer `stockIndicator` y etiqueta de envío hoy en tarjetas PLP.

## Impact

- `apps/storefront`: `src/lib/catalog/` (listado, facetas), páginas `(shop)/c/*`, `(shop)/search`, `ProductCatalog`, `ProductCard`, nuevo `QuickView`, utilidades URL de filtros.
- `apps/cms`: campos facetables mínimos en `products` si no existen (`color`, `material`, `ecoLabel` o equivalente en pestaña enrichment); relación categoría en producto para filtro contextual.
- Paquetes: `@jeyjo/pricing`, lectura stock existente.
- Desbloquea ROADMAP #11 (`pdp-product-detail`), #15 (`home-segmented-banners`), #38 (`product-comparison-plp`).
- Depende de #6, #7, #9 (completados). Alineado a alcance §1.7, **RF-010**, **RF-011**, **US-01** (listado, no predictivo), **US-02**.

## Non-Goals

- Comparativa de hasta 3 productos (**US-06**, cambio #38).
- Búsqueda predictiva &lt;150 ms, Qdrant, worker `search_events` (#13–14).
- Lógica completa de envase cerrado en PDP (#11); en PLP solo incrementos por `packUnit` en add-to-cart.
- Imágenes dual-source reales (#21); placeholder/glyph hasta PIM.
- Auth B2B automática y precios por sesión real (#16); toggle manual en cabecera se mantiene.
- Home segmentada y carruseles (#15).
- Paginación infinita o SSR de miles de SKUs con índices dedicados (fase inicial: límite razonable + paginación clásica).
