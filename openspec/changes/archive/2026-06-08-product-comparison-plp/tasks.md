## 1. Compare store and URL helpers



- [x] 1.1 Add `useCompareStore` (Zustand + persist `jeyjo-compare`) with toggle, clear, max-3 guard and CA2 message constant (verify: unit test — fourth toggle rejected, message surfaced)

- [x] 1.2 Add `lib/compare/parse-compare-skus.ts` and `buildCompareUrl(skus)` for CSV/repeatable query params (verify: unit test — round-trip order preserved)



## 2. Catalog batch loader



- [x] 2.1 Add `fetchPublicProductsBySkus(skus)` reusing `public-product-filter` from `fetch-product-list.ts` (verify: unit test — wildcard/unpublished SKU excluded)

- [x] 2.2 Add `loadComparePage(skus)` mapping to `CompareColumn` with shortDescription stripped, quotes batch, stock batch (verify: unit test — mapper handles null facet fields as "—")



## 3. PLP card and compare bar UI



- [x] 3.1 Add compare checkbox to `ProductCard` PLP mode (`row` prop); wire `useCompareStore` with `aria-checked` (verify: manual US-06 CA1 on `/c/*` card)

- [x] 3.2 Add `CompareBar` client component: thumbnails, count, clear, navigate when ≥2 SKUs (verify: manual — bar visible with 1 SKU, compare button enabled at 2)

- [x] 3.3 Mount `CompareBar` in `(shop)/layout.tsx` (verify: bar persists across PLP routes)

- [x] 3.4 Style compare controls using existing tokens only — no new hardcoded hex (verify: lint/grep component files)



## 4. Comparison page



- [x] 4.1 Add `(shop)/comparar/page.tsx` server page reading `skus` param, calling `loadComparePage`, empty/invalid states (verify: `/comparar?skus=A,B` renders two columns)

- [x] 4.2 Add `CompareTable` with rows: price (dual), brand, supplier, color, material, pack unit, stock, description (verify: manual US-06 CA3)

- [x] 4.3 Add per-column add-to-cart with `packUnit` + minicart open (verify: manual US-06 CA4)

- [x] 4.4 Responsive horizontal scroll + sticky attribute labels on mobile (verify: manual 320px viewport)



## 5. Edge cases and sync



- [x] 5.1 On `/comparar` load, prune invalid SKUs from store and show warning when <2 valid remain (verify: unit/integration — invalid SKU scenario)

- [x] 5.2 Disable compare bar primary action and show hint when only 1 SKU selected (verify: manual)

- [x] 5.3 Optional env `NEXT_PUBLIC_COMPARE_ENABLED=false` hides bar and card control (verify: flag off — no compare UI)



## 6. Tests and verification



- [x] 6.1 Unit tests: compare store, parse-compare-skus, fetchPublicProductsBySkus filter (verify: `pnpm --filter storefront test` passes)

- [ ] 6.2 Run `pnpm --filter storefront typecheck` and `build` (verify: no errors — pre-existing failures outside compare scope)

- [ ] 6.3 Manual checklist US-06 CA1–CA4: select 3 on PLP, fourth shows exact Spanish message, compare page attributes, add-to-cart from table

- [x] 6.4 Update `apps/storefront/.env.example` with `NEXT_PUBLIC_COMPARE_ENABLED` if added (verify: env example documents flag)

