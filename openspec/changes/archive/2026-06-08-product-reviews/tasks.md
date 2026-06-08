## 1. CMS product-reviews collection

- [x] 1.1 Add `product-reviews` collection with fields, status options (Pendiente/Aprobada/Rechazada), audit hooks, and staff access (`catalogo` + `superadmin` only; storefront API key for create) (verify: `/admin/collections/product-reviews` loads)

- [x] 1.2 Deny staff manual create in access control; allow storefront API key create/update for author fields (verify: staff create returns denied; API key create succeeds in int test)

- [x] 1.3 Add `reviewCount` and `ratingAverage` fields on `products`; implement `afterChange`/`afterDelete` hook to recalculate aggregates from approved reviews (verify: approving a review updates product fields)

- [x] 1.4 Enforce one review per `(webProfileId, product)` via unique index or `beforeValidate` hook (verify: duplicate create returns conflict)

- [x] 1.5 Register collection in `payload.config`, `COLLECTION_ACCESS`, and `isCollectionHidden` (verify: collection visible to catalogo role)

- [x] 1.6 Generate and apply Payload migration for `product_reviews` table and product aggregate columns (verify: `pnpm --filter cms payload migrate` succeeds)

## 2. CMS reviews moderation inbox

- [x] 2.1 Add `/admin/product-reviews` inbox view with columns: status, product, SKU, rating, author, date, re-edition badge (verify: pending reviews listed by default)

- [x] 2.2 Add filters for status and search by SKU/title/author; approve and reject actions with optional `rejectionNote` (verify: approve transitions status and updates product aggregates)

- [x] 2.3 Add delete action with aggregate recalculation (verify: deleting approved review updates `reviewCount`)

## 3. Storefront purchase verification and API

- [x] 3.1 Implement `assertCustomerPurchasedSku(customerId, sku)` reusing web orders + ERP purchase-history merge (verify: unit test with mocked order snapshots)

- [x] 3.2 Add Payload client helpers for product-reviews CRUD via `STOREFRONT_PAYLOAD_API_KEY` (verify: create/read/update against local CMS)

- [x] 3.3 Add `GET /api/products/[slug]/reviews` (approved, paginated) and `GET .../reviews/mine` (verify: public list excludes pending)

- [x] 3.4 Add `POST` and `PATCH /api/products/[slug]/reviews` with session, purchase check, displayName check, validation, and pending reset on edit (verify: 401 anonymous, 403 no purchase, 422 no displayName)

## 4. Storefront catalog aggregates

- [x] 4.1 Map `reviewCount`/`ratingAverage` from CMS product in `mapDocToRow` and `mapPdpDocToView`; remove PLP hardcode `rating: 4.5` (verify: product with 0 reviews has `rating: null`)

- [x] 4.2 Update `PlpProductRow` / card components to hide stars when `reviews === 0` (verify: PLP card without stars for zero reviews)

- [x] 4.3 Ensure `?sort=rating` uses real `ratingAverage` (verify: sort test or manual check)

## 5. Storefront PDP valoraciones UI

- [x] 5.1 Extend `ProductTabs` with "Valoraciones" tab: approved list, empty state, pagination (verify: tab renders on PDP)

- [x] 5.2 Add `ProductReviewForm` client component: stars + comment, states for login CTA, no purchase, missing displayName, pending/rejected banners (verify: manual flow on PDP)

- [x] 5.3 Wire PDP header stars from real aggregates when `reviewCount > 0` (verify: header hidden when zero, visible when approved reviews exist)

- [x] 5.4 Load initial reviews server-side in `loadPdpPage` or tab loader (verify: no CMS secret in client bundle)

## 6. Tests and verification

- [x] 6.1 CMS int tests: status transitions, aggregate recalculation, staff create denied (verify: `pnpm --filter cms test:int` passes new specs)

- [x] 6.2 Storefront tests: purchase assertion, API validation, catalog mapping without placeholder (verify: `pnpm --filter storefront test` passes)

- [x] 6.3 Run `pnpm --filter storefront typecheck` and `pnpm --filter cms typecheck` (verify: no errors)

- [ ] 6.4 Manual E2E: logged-in purchaser submits review → pending in CMS inbox → approve → visible on PDP and PLP aggregates update
