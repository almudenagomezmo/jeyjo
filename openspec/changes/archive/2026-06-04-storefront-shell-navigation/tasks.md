## 1. Navigation data layer

- [x] 1.1 Add `NavNode` types and `fetchCategoriesFromCms` with `unstable_cache` (TTL 300s) in `src/lib/catalog/fetch-navigation-tree.ts` (verify: unit test mocks CMS JSON → tree with parent/child order)
- [x] 1.2 Implement `buildNavigationTree` (max depth 3, slug filter) and static fallback to `CATEGORIES` on error/empty (verify: test empty CMS → static root count matches `CATEGORIES.length`)
- [x] 1.3 Add `src/config/top-bar-messages.ts` and wire `TopBar` to import config (verify: change one message string updates UI on `/`)

## 2. Shell integration

- [x] 2.1 Add server `NavigationShell` wrapper in root `layout.tsx` that fetches tree and passes to `Header` (verify: no `PAYLOAD_SECRET` in client bundle grep)
- [x] 2.2 Refactor `MegaMenu` to accept `NavNode[]` prop; remove direct `CATEGORIES` import (verify: mega menu links use CMS slugs when seed present)
- [x] 2.3 Implement `MobileNav` drawer with overlay, Escape, focus trap; hamburger visible `<md` (verify: manual resize — drawer opens/closes on mobile width)
- [x] 2.4 Add skip link (`href="#main-content"`) and `id="main-content"` on `<main>` (verify: first Tab focuses skip link, second Tab enters main)

## 3. Route groups and breadcrumbs

- [x] 3.1 Move catalog routes under `app/(shop)/` and account under `app/(account)/` without URL changes (verify: `/c/escritura`, `/cuenta`, `/search` still 200)
- [x] 3.2 Add optional `(shop)/layout.tsx` container if needed for catalog pages (verify: build passes `pnpm --filter storefront build`)
- [x] 3.3 Add `buildBreadcrumbsFromPath` helper and render `Breadcrumb` on `/c/*`, `/p/*`, `/search` (verify: `/c/escritura/boligrafos` shows ≥3 crumbs when slugs in tree)

## 4. Footer and polish

- [x] 4.1 Update `Footer` catalog column from navigation tree roots; replace `#` with `/cuenta`, `/search` where applicable (verify: footer link hrefs not all `#`)
- [x] 4.2 Optional: seed Payload categories aligned to demo taxonomy for local QA (verify: after seed, mega menu matches former static names)
- [x] 4.3 Add storefront tests for tree builder + breadcrumb helper (verify: `pnpm --filter storefront test` passes)

## 5. Verification

- [x] 5.1 Run `pnpm --filter storefront typecheck` and `build` (verify: no errors)
- [x] 5.2 Manual responsive pass: desktop mega menu, mobile drawer, sticky header + mini-cart (verify: checklist in PR description)
- [x] 5.3 Document `CMS_URL` requirement in `apps/storefront/.env.example` and README shell section (verify: env example lists CMS_URL for navigation)
