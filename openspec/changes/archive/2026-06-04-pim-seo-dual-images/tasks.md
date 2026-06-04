## 1. Shared catalog-images package

- [x] 1.1 Create `packages/catalog-images` with `resolveCatalogImage`, `resolveSeoImage`, types, and `package.json` `@jeyjo/catalog-images` (verify: `pnpm --filter @jeyjo/catalog-images test` passes all fallback branches)
- [x] 1.2 Add workspace dependencies in `apps/cms` and `apps/storefront` (verify: `pnpm install` resolves workspace link)

## 2. CMS integration

- [x] 2.1 Replace `apps/cms/src/utilities/resolveDisplayImage.ts` with re-export from `@jeyjo/catalog-images` (verify: existing CMS int tests still pass)
- [x] 2.2 Extend `Products` `defaultPopulate` with `meta.image` depth (verify: GET `/api/products` depth 1 returns `meta.image.url` when set)
- [x] 2.3 Update `enrichmentFields` admin descriptions for catalog vs SEO image copy (verify: Marketing tab and SEO Preview tab show distinct help text)
- [x] 2.4 Implement `POST /api/products/bulk-seo-template` with staff access, `{title}` template, empty-only option, max 500 ids (verify: bulk on 2 products sets `meta.description`; audit log entries exist)
- [x] 2.5 Add PIM health admin view (counts + links: no catalog image, no meta, duplicate slugs) (verify: seed product missing image appears in list)
- [x] 2.6 Wire search indexer `thumbnailUrl` to `resolveCatalogImage` only (verify: int test — product with `meta.image` only does not set thumbnail from meta)

## 3. Storefront catalog images

- [x] 3.1 Use `@jeyjo/catalog-images` in `fetch-product-pdp.ts` and `fetch-product-list.ts` / `mapDocToRow` — add `imageUrl` to `PlpProductRow` (verify: row has URL when `ownImage` populated in fixture)
- [x] 3.2 Update `ProductCard` and PLP quick view to render `ProductImage` with `imageUrl` or glyph (verify: PLP card shows img src for provider-only product)
- [x] 3.3 Update suggest API hydration to populate catalog thumbnail via package (verify: `POST /api/search/suggest` returns thumbnail URL for product with `ownImage`)

## 4. Storefront SEO metadata

- [x] 4.1 Extend PDP `generateMetadata` with `openGraph` and `twitter` using `resolveSeoImage` + absolute URLs (verify: View Source on PDP shows `og:image` when `meta.image` set)
- [x] 4.2 Add JSON-LD `Product` script on PDP page with name, description, sku, image (verify: Rich Results test or manual parse of ld+json)
- [x] 4.3 Confirm PDP gallery still uses `resolveCatalogImage` only (verify: product with different meta vs own images — gallery shows own, og shows meta)

## 5. Tests and verification

- [x] 5.1 Unit tests in storefront for metadata helpers (verify: `pnpm --filter storefront test` passes)
- [x] 5.2 Manual RF-024 checklist: provider-only PDP, own+provider PDP, no image placeholder, US-16 bulk template on staging (verify: documented in PR or change notes)
- [x] 5.3 Run `pnpm --filter storefront typecheck` and `pnpm --filter cms typecheck` (verify: no errors)
- [x] 5.4 Run `openspec validate pim-seo-dual-images` if available, else `openspec status --change pim-seo-dual-images` shows complete (verify: all artifacts done)
