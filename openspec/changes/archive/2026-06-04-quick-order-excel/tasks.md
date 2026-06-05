## 1. Dependencies and reference resolution

- [x] 1.1 Add `xlsx` to `apps/storefront/package.json` (verify: `pnpm install` succeeds)
- [x] 1.2 Implement `resolveProductByReference` in `lib/intranet/quick-order/resolve-reference.ts` (sku → oem → ean, wildcard filter) (verify: unit test unknown → null, REF-001 → slug)
- [x] 1.3 Add `roundQtyToPack` reuse from PDP in quick-order helpers (verify: pack 6, qty 3 → 6)

## 2. APIs

- [x] 2.1 `POST /api/intranet/quick-order/lookup` with B2B guard + preview DTO (verify: 401 without session; REF-001 returns quote)
- [x] 2.2 `POST /api/intranet/quick-order/parse-excel` multipart parser (headers Referencia/Cantidad, max 500 rows) (verify: fixture 10 rows → 10 ok)
- [x] 2.3 `POST /api/intranet/quick-order/add` batch validate + additions payload (verify: mirrors repeat API semantics)
- [x] 2.4 Commit `public/intranet/plantilla-pedido-rapido.xlsx` template (verify: download has correct headers)

## 3. Uncatalogued requests → checkout

- [x] 3.1 `sessionStorage` helpers for uncatalogued lines in `lib/checkout/uncatalogued-requests.ts` (verify: unit round-trip)
- [x] 3.2 Append uncatalogued block to checkout `observations` on prepare (verify: integration or unit on formatter)

## 4. UI

- [x] 4.1 Replace `pedido-rapido/page.tsx` scaffold with `QuickOrderPanel` (manual lookup debounced, preview card, add button) (verify: `/intranet/pedido-rapido` no Próximamente badge)
- [x] 4.2 Excel dropzone + results table + batch add CTA (verify: manual staging — 10-row file adds cart count)
- [x] 4.3 Uncatalogued form when lookup not_found (verify: saves request, no cart line)
- [x] 4.4 Wire add → `addItems` + minicart toast (verify: same as purchase-history repeat pattern)
- [x] 4.5 Update `navigation.ts` — remove scaffold badge for pedido-rapido (verify: `intranet-portal.test.ts` updated)

## 5. Tests and verification

- [x] 5.1 Unit: Excel parser (headers variants, invalid file, row limits) (verify: `pnpm --filter storefront test`)
- [x] 5.2 Unit/API: lookup OEM/EAN fixtures if seeded (verify: tests pass in CI)
- [x] 5.3 Test RF-019: 10 valid references → 10 additions in one add call (verify: dedicated test file)
- [x] 5.4 Update `intranet-portal.test.ts` for production pedido-rapido route (verify: no roadmap-only scaffold assertion)
- [x] 5.5 MANUAL-VERIFY.md: US-11 CA1–CA4 checklist on staging B2B account
