## 1. Catalog reference resolution

- [x] 1.1 Add `resolveProductByReference` (skuErp → oemRef → ean) with `isPublicCatalogProduct` guard
- [x] 1.2 Unit tests: SKU, OEM, EAN match, wildcard/draft excluded, unknown ref returns null
- [x] 1.3 Reuse resolver in shared preview mapper (name, slug, thumbnail, packUnit)

## 2. Excel parsing and template

- [x] 2.1 Add `xlsx` dependency to `apps/storefront`
- [x] 2.2 Implement `parseQuickOrderSpreadsheet` with flexible headers and 200-row / 5MB limits
- [x] 2.3 Unit tests: Spanish/English headers, empty qty defaults to 1, invalid rows flagged
- [x] 2.4 Expose downloadable template (static file or `GET /api/intranet/quick-order/template`)

## 3. Storefront APIs

- [x] 3.1 `GET /api/intranet/quick-order/lookup` with B2B guard and B2B `PriceQuote`
- [x] 3.2 `POST /api/intranet/quick-order/validate-batch` (multipart + JSON items)
- [x] 3.3 `POST /api/intranet/quick-order/add-to-cart` (mirror purchase-history repeat response shape)
- [x] 3.4 Integration tests: 401 without session, wildcard 404, batch 10 valid SKUs (RF-019)

## 4. Non-catalog session and checkout

- [x] 4.1 Implement `useNonCatalogRequests` sessionStorage helpers (add/list/remove/clear)
- [x] 4.2 Merge pending requests into checkout observations with 500-char guard
- [x] 4.3 Clear requests after successful `place-order`; unit test merge/truncation

## 5. Intranet UI

- [x] 5.1 Replace `/intranet/pedido-rapido` scaffold with `QuickOrderPage` (manual entry, preview, add)
- [x] 5.2 Excel dropzone, validate-batch results table, batch add CTA, template link
- [x] 5.3 Non-catalog panel after lookup 404; pending list with remove
- [x] 5.4 Remove `scaffold` for pedido-rapido in `lib/intranet/navigation.ts`
- [x] 5.5 Wire add-to-cart → `addItems` + minicart open; verify design tokens only (globals.css)

## 6. Verification and docs

- [x] 6.1 Playwright: single reference add shows preview and cart line with B2B price
- [x] 6.2 Playwright: Excel 10 valid rows → 10 cart lines in one confirm (US-11 CA3)
- [x] 6.3 Manual checklist: OEM/EAN lookup, not-found → non-catalog → checkout observations
- [x] 6.4 Add `QUICK_ORDER_ENABLED` flag and document in storefront env example
