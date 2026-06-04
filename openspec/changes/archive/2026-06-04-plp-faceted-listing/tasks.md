## 1. CMS facet fields

- [x] 1.1 Add `facetColor`, `facetMaterial`, `ecoLabel` (and product–category relationship if missing) on Payload `products` enrichment tab (verify: admin save persists fields)
- [x] 1.2 Optional seed: set facet values on stub-synced products for local QA (verify: at least one product per facet dimension in CMS)

## 2. Catalog list layer

- [x] 2.1 Add `PlpProductRow` types and `fetch-product-list.ts` with `listPublicProducts` + `searchPublicProducts` using `public-product-filter` (verify: unit test — wildcard SKU excluded)
- [x] 2.2 Add `buildFacetAggregates` pure function with RF-010 count semantics (verify: test — two filters + brand count matches spec scenario)
- [x] 2.3 Add `plp-search-params.ts` parser/serializer for filters, sort, page (verify: round-trip URL `?brand=bic&inStockToday=1`)

## 3. Pricing and stock batch

- [x] 3.1 Add `POST /api/pricing/batch` (server-only) returning `Record<sku, PriceQuote>` without P2 for anonymous (verify: integration test with fixture SKUs)
- [x] 3.2 Add `getStockIndicatorsBatch(skus)` or extend list fetch to include `stockIndicator` (verify: mock CMS — 24 SKUs ≤2 fetch groups)

## 4. PLP pages (server)

- [x] 4.1 Wire `/c/[category]` and `/c/[category]/[sub]` to CMS list + facets + batch quotes (verify: page renders without `lib/data/products` import)
- [x] 4.2 Wire `/search` to `searchPublicProducts` + same PLP shell when `q` present (verify: `/search?q=REF-001` shows matching card)
- [x] 4.3 Add pagination component preserving query string (verify: `page=2` keeps `brand` filter)

## 5. UI components

- [x] 5.1 Refactor `ProductCatalog`: `FacetSidebar` with color, material, price range, eco, in-stock-today, brand; show counts per RF-010 (verify: manual — two filters narrow grid)
- [x] 5.2 Update `ProductCard` to accept `PriceQuote` + stock indicator; remove stub `getPriceView(product)` on PLP (verify: US-02 CA1 — dual price from quote)
- [x] 5.3 Add `QuickViewDialog` with add-to-cart using `packUnit` steps (verify: packUnit 12 adds quantity 12)
- [x] 5.4 Confirm stock badge uses `--stock-*` tokens from `globals.css` only (verify: no new hardcoded hex in components)

## 6. Tests and verification

- [x] 6.1 Unit tests: facet aggregates, search-params, public list filter (verify: `pnpm --filter storefront test` passes)
- [x] 6.2 Run `pnpm --filter storefront typecheck` and `build` (verify: no errors)
- [x] 6.3 Manual RF-010: select brand + "En stock para envío hoy" — only intersection shown; facet counts visible before click
- [x] 6.4 Document `PLP_DEMO_FALLBACK` and CMS facet fields in `apps/storefront/.env.example` (verify: env example updated)
