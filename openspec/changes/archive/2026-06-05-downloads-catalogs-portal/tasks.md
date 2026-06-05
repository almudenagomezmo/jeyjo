## 1. Payload B2B catalog downloads collection

- [x] 1.1 Create `B2bCatalogDownloads` collection with fields per design (title, description, documentType, file, coverImage, validFrom, validUntil, customerGroups, published)
- [x] 1.2 Add validation: `validUntil >= validFrom`, PDF-only on `file`, 25 MB limit (verify: invalid date range rejected)
- [x] 1.3 Register staff access for `superadmin`, `marketing`, `personalizacion` in `staffRoles.ts`; deny public REST without API key
- [x] 1.4 Wire audit hooks on create/update/delete (verify: publish change writes audit entry)
- [x] 1.5 Register collection in `payload.config.ts` and regenerate types (`pnpm --filter cms generate:types`)

## 2. CMS seed and fixtures

- [x] 2.1 Add minimal PDF fixture in `apps/cms/tests/fixtures/` for upload tests
- [x] 2.2 Seed dev data: vigente "Catálogo General 2026" + caducado "Ofertas Q1 2025" (verify: only vigente would match validity filter)

## 3. Storefront service layer

- [x] 3.1 Create `lib/intranet/catalog-downloads/types.ts` and `validity.ts` with Europe/Madrid date helpers
- [x] 3.2 Implement `fetchB2bCatalogDownloads({ customerGroup })` against Payload REST with API key and depth 1
- [x] 3.3 Map documents to DTO with `resolveAbsoluteMediaUrl` for `downloadUrl` and `coverImageUrl`
- [x] 3.4 Unit tests: validity filter (expired, future, today inclusive), empty customerGroups = all groups, group filter

## 4. Storefront API

- [x] 4.1 `GET /api/intranet/catalog-downloads` with B2B guard and `orders` permission check for subusers
- [x] 4.2 Integration tests: 401 guest, 403 non-B2B/subuser without orders, 200 returns only vigente docs for session group

## 5. Intranet UI

- [x] 5.1 Replace `/intranet/descargas` scaffold with `CatalogDownloadsPage` — sections by documentType, cards with cover, validity badge, download button
- [x] 5.2 Remove `scaffold` metadata for `/intranet/descargas` in `lib/intranet/navigation.ts`
- [x] 5.3 Empty state when no valid documents; responsive layout using design tokens only (no hardcoded hex)
- [x] 5.4 Manual verify: `empresa@test.com` opens Descargas — no "Próximamente" badge, vigente catalog downloadable, expired hidden (US-07 CA2)

## 6. Verification

- [x] 6.1 Run storefront and CMS unit/integration tests for catalog-downloads module
- [x] 6.2 Staging smoke: marketing publishes new offer magazine with tomorrow `validFrom` — not visible until start date
- [x] 6.3 Document rollback: restore `IntranetScaffoldPage` and navigation `scaffold` if feature flag needed
