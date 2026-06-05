## 1. CMS schema



- [x] 1.1 Add `additionalImages` array field (max 8 uploads) to `enrichmentFields.ts` with admin copy in Spanish

- [x] 1.2 Include `additionalImages` in Products `defaultPopulate` in `collections/Products/index.ts`

- [x] 1.3 Regenerate Payload types (`pnpm --filter cms generate:types` or project equivalent) and verify `Product.additionalImages` in `payload-types.ts`



## 2. Catalog image resolution



- [x] 2.1 Extend `packages/catalog-images/src/types.ts` with `PdpGalleryFields` (`additionalImages` array)

- [x] 2.2 Implement `resolvePdpGalleryUrls` with order, dedupe, and null-safe branches

- [x] 2.3 Export from package index and add unit tests for all spec scenarios

- [x] 2.4 Run `pnpm --filter @jeyjo/catalog-images test`



## 3. Storefront data layer



- [x] 3.1 Add `galleryUrls: string[]` to `PdpProductView` in `src/lib/pdp/types.ts`

- [x] 3.2 Map `additionalImages` in `fetch-product-pdp.ts` via `resolvePdpGalleryUrls` + `absoluteMediaUrlOrNull`

- [x] 3.3 Add unit test for `mapPdpDocToView` gallery mapping (fixture with primary + 2 extras)



## 4. PDP gallery UI



- [x] 4.1 Fix `ProductImage` thumbnail sizing (`variant="thumb"` or equivalent `w-full h-full min-h-0`)

- [x] 4.2 Create client component `ProductImageGallery` (primary + clickable thumbnails, hide row when length ≤ 1)

- [x] 4.3 Replace hardcoded `[0,1,2,3]` block in `(shop)/p/[id]/page.tsx` with `ProductImageGallery`

- [x] 4.4 Optional: extend JSON-LD `Product.image` to array when `galleryUrls.length > 1` if trivial in existing helper



## 5. Verification



- [x] 5.1 Run `pnpm --filter storefront typecheck` and `pnpm --filter storefront test`

- [x] 5.2 Manual RF-012: product with 3 images — thumbnails visible, click swaps primary, single-image product has no thumbnail row

- [x] 5.3 Manual CMS: upload extras in Marketing tab, publish, confirm storefront reflects order

