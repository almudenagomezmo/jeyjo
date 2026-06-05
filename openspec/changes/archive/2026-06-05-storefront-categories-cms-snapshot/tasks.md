## 1. Category snapshot

- [x] 1.1 Add `CmsCategoryDoc` field `homeGlyph` and snapshot types in `fetch-navigation-tree.ts` (verify: TypeScript compiles with optional `homeGlyph`)
- [x] 1.2 Create `apps/storefront/data/category-tree.snapshot.json` initial file and `scripts/sync-category-snapshot.mjs` (verify: `pnpm --filter storefront sync:categories` writes JSON with `syncedAt` and non-empty `docs` when CMS seeded)
- [x] 1.3 Add `sync:categories` script to `apps/storefront/package.json` and root `package.json` (verify: `pnpm sync:categories` from repo root runs storefront script)
- [x] 1.4 Implement `readCategorySnapshot()` and unified `fetchCategoryDocs()` with resolution order CMS → snapshot → [] (verify: unit test CMS mock fail + snapshot fixture → tree non-empty)
- [x] 1.5 Fix `unstable_cache` so empty CMS responses are not cached as hits (verify: test or manual — CMS empty then populated does not freeze empty tree for 300s)

## 2. Glyphs and cleanup

- [x] 2.1 Use `doc.homeGlyph` in `buildSubtree`; remove `SLUG_GLYPH_MAP` (verify: root with `homeGlyph: pen` in CMS shows pen in mega menu)
- [x] 2.2 Remove `SLUG_GLYPH_FALLBACK` from `FeaturedCategories.tsx`; use `homeGlyph` from merch/nav only (verify: featured grid renders without slug map import)
- [x] 2.3 Remove runtime `staticCategoriesToNavNodes`, `CATEGORIES` export, `getCategory`, and `searchCategories` demo (verify: grep `lib/data/categories` only in tests/fixtures)
- [x] 2.4 Move minimal taxonomy fixture to `tests/fixtures/categories.ts` and update tests (verify: `pnpm --filter storefront test` passes)

## 3. Third-level family PLP

- [x] 3.1 Add `app/(shop)/c/[category]/[sub]/[family]/page.tsx` mirroring subcategory PLP (verify: `/c/escritura/boligrafos/gel` returns 200 when family in tree)
- [x] 3.2 Update `MegaMenu` and `MobileNav` family links to `/c/{root}/{sub}/{family}` (verify: no `#slug` hrefs remain in navigation components)
- [x] 3.3 Extend breadcrumb tests for three-segment paths (verify: test expects Home → root → sub → family labels)

## 4. CMS seed

- [x] 4.1 Extend `storefront-navigation.ts` seed with demo families under `boligrafos` (gel, tinta) idempotently (verify: after re-seed, Payload admin shows 3 levels under Escritura)
- [x] 4.2 Re-run `pnpm sync:categories` and commit updated snapshot including family docs (verify: snapshot contains `gel` and `tinta` slugs with parent refs)

## 5. Documentation and verification

- [x] 5.1 Update `apps/storefront/README.md` and `.env.example` with sync:categories workflow and snapshot fallback (verify: docs mention snapshot, not static CATEGORIES)
- [x] 5.2 Run `pnpm --filter storefront typecheck`, `test`, and `build` (verify: all pass)
- [x] 5.3 Manual QA: mega menu 3 levels, family PLP, snapshot fallback with CMS stopped (verify: navigation still renders from snapshot file)
