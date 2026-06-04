## Context

- **Estado actual:** Páginas `/c/[category]`, `/c/[category]/[sub]` y `/search` renderizan `ProductCatalog` con `getProductsByCategory` / búsqueda demo desde `lib/data/products.ts`. `ProductCatalog` ya ofrece filtros cliente (marca, precio máximo, eco, ofertas, stock binario) sin recuentos por faceta ni URL compartible. `ProductCard` calcula precios con `getPriceView(product)` sobre campos stub, no con `PriceQuote` del motor #6. Catálogo CMS (#7) y stock (#8) existen por SKU pero no alimentan listados.
- **Alcance:** §1.7 listado facetado, **RF-010**, **RF-011**, **US-02** (tarjetas), base **US-01** en `/search` sin predictivo.
- **Dependencias ROADMAP:** #6 (`price-engine-core`), #7 (`catalog-sync-read-stub`), #9 (`storefront-shell-navigation`). Bloquea #11, #15, #38.

## Goals / Non-Goals

**Goals:**

- Servidor: `listPublicProducts({ categorySlugs?, q?, page, pageSize })` desde Payload REST con `public-product-filter` (publicado, no wildcard).
- Modelo `PlpProduct` serializable (sku, título, slug, supplierName, color, material, eco, categoryIds, packUnit, rating opcional, imagen resuelta o glyph).
- Motor de facetas en servidor: agregar valores distintos y recuentos sobre el conjunto **candidato** (categoría o búsqueda) respetando filtros activos salvo la dimensión que se está contando (patrón estándar RF-010).
- Cliente: `ProductCatalog` recibe `products`, `facets`, `activeFilters`, `sort`, `total`; sincroniza con `useSearchParams` / `nuqs` (`brand`, `color`, `material`, `priceMin`, `priceMax`, `inStockToday`, `eco`, `sort`, `page`).
- Precios PLP: `POST /api/pricing/batch` (server-only) devuelve `Record<sku, PriceQuote>` para SKUs visibles en página; `ProductCard` usa quotes hidratados vía prop o SWR con clave estable.
- Stock PLP: incluir `stockIndicator` en listado CMS o resolver en batch `getStockIndicator` acotado a SKUs de página (cache 60s).
- Vista rápida: `QuickViewDialog` (Radix/shadcn pattern existente) con resumen, precios dual, add-to-cart por `packUnit`.
- Paginación clásica (48 ítems/página) con enlaces `?page=2` preservando filtros.
- Tokens: reutilizar `StockBadge`, colores `--stock-*` de `globals.css`; sin hex nuevos.

**Non-Goals:**

- Comparativa US-06 (#38), Qdrant (#13–14), home (#15), imágenes PIM (#21), auth B2B real (#16).
- Facetas dinámicas arbitrarias desde ERP (solo dimensiones acordadas + extensión vía campos enrichment).
- SSR de catálogo completo sin paginación.

## Decisions

### 1. Fuente de listado: Payload REST + cache

**Decisión:** `fetchPublicProductsFromCms` en `src/lib/catalog/fetch-product-list.ts` usa `GET ${CMS_URL}/api/products` con `where` por categoría (relación), `depth=1`, `limit`/`page`, `sort`, filtrado post-fetch con `isPublicProduct`. `unstable_cache` 120s por clave `(categorySlug, page)`.

**Alternativa descartada:** Supabase replica — segunda fuente de verdad.

**Fallback:** Si CMS falla en PLP de categoría, lista vacía con mensaje y CTA a home; en dev opcional merge con demo `products.ts` tras flag `PLP_DEMO_FALLBACK=true`.

### 2. Campos facetables en CMS

**Decisión:** Añadir en `products` (pestaña enrichment, editables por staff): `facetColor` (text), `facetMaterial` (text), `ecoLabel` (checkbox). Marca = `supplier.name` (relación). Categorías = relación `categories[]` existente o nueva M2M si solo hay una — usar la relación ya modelada en sync.

**Alternativa:** Atributos JSON libre — más flexible pero peor UX admin; pospuesto a #21 PIM.

### 3. Agregación de facetas en servidor

**Decisión:** Tras cargar candidatos de la página lógica (máx. 500 para agregación en v1), función pura `buildFacetAggregates(products, activeFilters)` devuelve `{ brands: {value, count}[], colors: ..., ... }` donde `count` refleja productos que coincidirían si se **añadiera** ese valor manteniendo otros filtros (RF-010).

**Alternativa:** Solo cliente sobre array completo — rompe con paginación; descartada.

### 4. Filtro precio sobre quote resuelto

**Decisión:** Servidor resuelve quotes para candidatos antes de filtrar por rango; usa `netUnit` para B2B simulado (header toggle) y `grossUnit` o regla dual para B2C según `priceMode` cookie/query futura. En v1 anónimo: filtrar por P1 net (`p1_retail`).

### 5. URL state y ordenación

**Decisión:** Parser central `plp-search-params.ts` valida enums y arrays (`brand` repetido o CSV). Ordenación por defecto `relevance` (orden CMS `sortOrder` o título).

### 6. Precios en tarjeta

**Decisión:** Página servidor prefetch batch quotes para SKUs de la página actual; pasa `quotesBySku` a `ProductGrid`. Cliente no llama pricing por tarjeta individual (evita N+1 browser).

**Alternativa:** Client fetch por SKU — latencia y exposición; descartada.

### 7. Vista rápida y add-to-cart

**Decisión:** `QuickView` client component; cantidad inicial = `packUnit`; step = `packUnit` (CA-PRECIOS-005 parcial). Botón carrito deshabilitado si `allowOrderWithoutStock` false y nivel `limited`.

### 8. Búsqueda `/search`

**Decisión:** Mismo shell PLP; filtro texto con `contains` en título/sku/ean vía CMS `where` o filtro servidor sobre candidatos si API limitada. Sin Qdrant hasta #14.

### 9. Arquitectura de componentes

**Decisión:** Mantener `ProductCatalog` como orquestador cliente; páginas RSC pasan datos iniciales desde servidor + `searchParams` para hidratar filtros. Extraer `FacetSidebar`, `FacetCheckbox`, `PriceRangeFacet`.

## Risks / Trade-offs

- **[Risk] Payload `where` compuesto limitado** → Mitigation: filtrar en servidor sobre batch acotado; documentar límite 500 en dev warning.
- **[Risk] Batch pricing lento con 48 SKUs** → Mitigation: paralelizar con `Promise.all` acotado (concurrencia 8), cache quote 30s, cumplir RNF-003 agregado &lt;200ms p95 objetivo en staging.
- **[Risk] Campos color/material vacíos tras sync ERP** → Mitigation: facetas ocultas si cardinalidad 0; staff rellena enrichment; seed QA en apply.
- **[Trade-off] Recuentos sobre subconjunto paginado vs catálogo completo** → v1 agrega sobre candidatos de categoría (hasta 500); paginación solo afecta grid, no recuentos globales — aceptado hasta índice dedicado.

## Migration Plan

1. Añadir campos facet en CMS + migración/seed opcional.
2. Implementar `fetch-product-list`, facet builder, tests puros.
3. Añadir `POST /api/pricing/batch` y wiring en PLP pages.
4. Refactor `ProductCatalog` / `ProductCard` / `QuickView`; eliminar dependencia demo en `/c/*`.
5. Verificar `pnpm --filter storefront typecheck`, `test`, `build`; manual RF-010 (dos filtros) y US-02 CA1 en tarjeta.
6. Rollback: feature flag `PLP_USE_DEMO_DATA=true` restaura `getProductsByCategory`.

## Open Questions

- ¿Relación producto–categoría ya existe en Payload tras #7? **Acción apply:** confirmar campo y poblar en seed; si falta, añadir `categories` relationship en esta change.
- ¿Etiqueta exacta "En stock para envío hoy" vs "Disponible"? **Decisión:** copy RF-010 en filtro; badge sigue etiquetas semáforo #8.
