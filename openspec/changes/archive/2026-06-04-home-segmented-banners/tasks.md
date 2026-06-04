## 1. CMS home global

- [x] 1.1 Add `globals/Home.ts` with `promoBanners`, `featuredCategories`, carousel product arrays, date validation hook, and `personalizacion` access (verify: admin Globals → Home saves)
- [x] 1.2 Register `home` global in `payload.config.ts` and extend seed with active/expired sample banners + carousel SKUs (verify: `GET /api/globals/home` returns data after seed)
- [x] 1.3 Add optional `homeGlyph` on `categories` for featured grid icons if missing (verify: category edit shows field)

## 2. Catalog read layer

- [x] 2.1 Add `listPublicProductsByIds(ids)` preserving order and public filters (verify: unit test — draft/wildcard excluded)
- [x] 2.2 Add `fetch-home.ts` with `fetchHomeMerchandising()` + `unstable_cache` 120s (verify: returns null-safe shape when CMS down)

## 3. Banner and segment utilities

- [x] 3.1 Add `filterActiveBanners(banners, now, segment)` pure function (verify: test — expired and wrong segment omitted)
- [x] 3.2 Unify `HomeSegmentToggle` with header `PriceModeToggle` cookie key and `router.refresh()` (verify: toggling home updates header label)

## 4. Home UI components

- [x] 4.1 Port `HomeHero`, `SegmentCards`, `TrustStrip` from jeyjo-next using tokens only (verify: no new hex in `components/home/*`)
- [x] 4.2 Add `PromoBannerStrip` and `FeaturedCategories` with CMS + navigation fallback (verify: manual — 6 categories when global empty)
- [x] 4.3 Add `HomeProductCarousel` reusing `ProductCard` with quote + stock props (verify: section hidden when product list empty)

## 5. Home page server wiring

- [x] 5.1 Replace `apps/storefront/src/app/page.tsx` RSC: fetch global, resolve carousels, batch pricing/stock for all SKUs (verify: page has no `lib/data/products` import)
- [x] 5.2 Wire segment-specific carousels (B2C vs B2B top sales) and shared eco section (verify: manual — toggle shows different SKUs when curated differently)
- [x] 5.3 Graceful degradation when CMS fails (verify: stop CMS — hero + segment cards still render)

## 6. Tests and verification

- [x] 6.1 Unit tests: `filterActiveBanners`, `listPublicProductsByIds` (verify: `pnpm --filter storefront test` passes)
- [ ] 6.2 Run `pnpm --filter storefront typecheck` and `build` (verify: no errors) — blocked: pre-existing auth TS errors + intranet route conflict
- [x] 6.3 Manual US-02: home carousel card shows dual price from quote for anonymous visitor (verify: CA1 — net prominent, gross secondary in B2C mode)
- [x] 6.4 Document `CMS_URL` / home global in `apps/storefront/.env.example` (verify: env example updated)
