## 1. ERP purchase history port

- [x] 1.1 Add `ErpPurchaseHistoryReader` port, DTOs, and stub adapter with fixtures (including REF-010 / empresa@test.com CA-B2B-004)
- [x] 1.2 Export port in `@jeyjo/erp-ports` bundle and add unit tests for filters and stub data
- [x] 1.3 Document expected Avansuite fields in stub README comment for future #36 adapter

## 2. Data merge and Payload read

- [x] 2.1 Implement `fetch-customer-orders` helper (confirmed+ statuses, 5-year window, by `customerRef`)
- [x] 2.2 Implement `mergePurchaseHistoryLines` (ERP + web, SKU aggregation, usualQty from latest purchase)
- [x] 2.3 Apply wildcard exclusion consistent with `fetch-public-products-by-skus`
- [x] 2.4 Unit tests: merge logic, wildcard omission, historical vs current price fields

## 3. Storefront APIs

- [x] 3.1 `GET /api/intranet/purchase-history` with B2B guard, filters, pagination, CMS enrich, batch `resolvePrice`
- [x] 3.2 `POST /api/intranet/purchase-history/repeat` with SKU validation and slug resolution
- [x] 3.3 Integration tests: 401 without session, CA-B2B-004 price in response, repeat rejects wildcard

## 4. Cart batch add

- [x] 4.1 Add `addItems` (or equivalent) to `cart-store` with merge semantics
- [x] 4.2 Wire repeat flow to batch add and minicart open + checkout observations toast

## 5. Intranet UI

- [x] 5.1 Replace `/intranet/pedidos` scaffold with `PurchaseHistoryPage` (filters, table/cards, **Precio actual** label)
- [x] 5.2 Remove `scaffold` entry for pedidos in `lib/intranet/navigation.ts`
- [x] 5.3 Client components: selection state, sticky **Añadir al carrito**, disabled rows without CMS product
- [x] 5.4 Verify UI uses design tokens only (no hardcoded hex); responsive layout per jeyjo-next patterns

## 6. Verification and docs

- [x] 6.1 Playwright or integration test for CA-B2B-004 (select REF-010, add to cart, assert cart uses current price)
- [x] 6.2 Manual checklist: filters date/reference/category, empty state, pagination
- [x] 6.3 Update demo customer seed if needed so staging has REF-010 fixture visible
