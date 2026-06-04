## 1. CMS fields and seed

- [x] 1.1 Verify or add `attachments` array field (`label` + upload `media`) on Payload `products` enrichment tab (verify: admin save persists attachment)
- [x] 1.2 Seed `relatedProducts`, `longDescription`, and sample attachment on stub products in `jeyjo-catalog.ts` (verify: at least one printer→toner cross-sell pair in CMS)

## 2. Catalog PDP fetch layer

- [x] 2.1 Extend CMS types to `CmsPdpProductDoc` and implement `fetchPublicProductPdpBySlug` with slug-first then SKU lookup, depth for supplier/categories/related (verify: unit test — wildcard returns null)
- [x] 2.2 Add `lexical-to-html.ts` sanitizer helper for `longDescription` (verify: test — script tags stripped from output)
- [x] 2.3 Add `mapPdpDocToView` and related-product row mapper reusing PLP row shape (verify: test — draft related excluded)

## 3. PDP page loader

- [x] 3.1 Implement `loadPdpPage(slugOrSku)` prefetching quote, stock indicator, and batch quotes/stock for related SKUs (verify: test mock — single CMS fetch + batch pricing)
- [x] 3.2 Add canonical redirect when URL uses SKU but slug exists (verify: `/p/REF-001` → `/p/{slug}` 308)
- [x] 3.3 Update `generateMetadata` and `generateStaticParams` from CMS slugs with `dynamicParams=true` (verify: page title matches product title)

## 4. Buy box and quantity (RF-008, US-03)

- [x] 4.1 Refactor `ProductBuyBox` to accept `PriceQuote`, `StockIndicatorPublic`, and `packUnit`; remove stub `getPriceView(product)` (verify: US-02 CA1 dual price from quote on PDP)
- [x] 4.2 Add `PackQtyStepper` with auto-round-up and US-03 CA2 inline notice (verify: packUnit 12 + input 5 → qty 12 + notice text)
- [x] 4.3 Wire add-to-cart rules: disable when limited without `allowOrderWithoutStock`; show US-03 CA4 banner on backorder add (verify: manual — limited + flag true shows validation message)

## 5. PDP page and components

- [x] 5.1 Rewrite `(shop)/p/[id]/page.tsx` to use `loadPdpPage`; remove `lib/data/products.ts` imports (verify: grep — no demo products import in PDP route)
- [x] 5.2 Update `ProductImage` to accept optional `imageUrl` with `next/image` fallback to glyph (verify: product with `ownImage` renders image)
- [x] 5.3 Update `ProductTabs`: render sanitized long description HTML; conditional attachments tab; hide rating block when CMS has no reviews (verify: long description HTML visible)
- [x] 5.4 Render related products via `ProductGrid` with `quotesBySku` and `stockBySku` from loader (verify: RF-012 — printer PDP lists configured toners)

## 6. Stock and pricing integration

- [x] 6.1 Replace numeric `StockBadge` on PDP with `StockIndicatorBadge` from PLP (verify: no numeric stock on buy box)
- [x] 6.2 Confirm `/api/pricing/resolve` and `/api/stock/[sku]` work for PDP SKU if client refresh needed (verify: API returns quote and indicator without internal quantities)

## 7. Tests and verification

- [x] 7.1 Unit tests: PDP fetch visibility, lexical sanitizer, pack qty round-up, related batch (verify: `pnpm --filter storefront test` passes)
- [x] 7.2 Run `pnpm --filter storefront typecheck` and `build` (verify: no errors)
- [x] 7.3 Manual RF-012: PDP shows gallery, long description, specs, cross-sell, attachments when present
- [x] 7.4 Document `PDP_USE_DEMO_DATA` rollback flag in `apps/storefront/.env.example` (verify: env example updated)
