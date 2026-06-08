## 1. CMS footer settings and API

- [x] 1.1 Create `FooterSettings` global with social URLs, EU badge fields, blog toggle/label, section toggles, and audit hooks (verify: global visible under Configuración del sistema)
- [x] 1.2 Extend `SystemConfigDto` and `map-dto.ts` with `footer` block including resolved `businessHours` (SKAI → default) (verify: `GET /api/system/config` returns footer JSON)
- [x] 1.3 Add footer card/link to `SystemConfigHubView` (verify: hub opens footerSettings edit)
- [x] 1.4 Unit test business hours precedence and empty social URL omission (verify: `pnpm --filter cms test` passes)

## 2. CMS site pages collection

- [x] 2.1 Create `sitePages` collection with slug, title, pageType, Lexical content, metaDescription, published, staff access (verify: create legal doc in Payload admin)
- [x] 2.2 Add idempotent seed script for v1 legal slugs + FAQ placeholder copy (verify: `pnpm --filter cms seed:site-pages` creates expected slugs)
- [x] 2.3 Expose read endpoint or document storefront fetch pattern via Payload REST/globals for published pages only (verify: unpublished slug not returned)

## 3. Storefront config and helpers

- [x] 3.1 Extend `fetchSystemConfig` / types with `footer` block; add `resolvePublicContact()` helper shared with EVA precedence rules (verify: unit test SKAI hours override)
- [x] 3.2 Create `lib/footer/links.ts` with v1 route map for Comprar/Ayuda columns (verify: no `#` hrefs in map)
- [x] 3.3 Add `lib/footer/fetch-site-page.ts` with cache for legal/FAQ content (verify: fetch returns null for unpublished)

## 4. Footer UI refactor

- [x] 4.1 Extract subcomponents: `FooterOmnichannel`, `FooterStores`, `FooterSocial`, `FooterEuBadge`, `FooterLegalBar`, `PaymentMethodIcons` (verify: Storybook or render test optional; compile clean)
- [x] 4.2 Refactor `Footer.tsx` grid to include omnichannel, stores, social, EU badge; wire `fetchSystemConfig` from `NavigationShell` (verify: home footer shows phone + stores when config set)
- [x] 4.3 Replace static column `#` links with `links.ts` routes; conditional blog link (verify: inspect DOM hrefs on `/`)
- [x] 4.4 Responsive pass at 375px and desktop — newsletter block unchanged (verify: no horizontal overflow)

## 5. Legal and FAQ routes

- [x] 5.1 Implement `(shop)/legal/[slug]/page.tsx` rendering Lexical content with shell layout and metadata (verify: `/legal/aviso-legal` 200 after seed)
- [x] 5.2 Implement `(shop)/ayuda/faq/page.tsx` with empty-state fallback (verify: FAQ renders or shows contact fallback)
- [x] 5.3 Add `not-found` handling for unknown legal slugs within styled 404 (verify: `/legal/unknown` → 404)

## 6. Verification and docs

- [x] 6.1 Storefront tests: footer link hrefs, omnichannel tel/mailto, blog hidden by default (verify: `pnpm --filter storefront test` passes)
- [x] 6.2 Manual checklist alcance §1.12: omnicanal, tiendas, redes, UE badge, legal links, newsletter, EVA contact coherence (**US-22** CA3)
- [x] 6.3 Document new seed command and footerSettings fields in `apps/cms/docs/seed.md` if applicable (verify: docs mention site-pages seed)
