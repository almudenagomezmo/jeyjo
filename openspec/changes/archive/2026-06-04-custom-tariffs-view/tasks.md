## 1. ERP pricing DTOs and stub

- [x] 1.1 Extend `ErpSpecialPriceDto` with optional `recommendedNetPrice`, `discount1Pct`, `discount2Pct`, `minQty`
- [x] 1.2 Add stub fixtures: REF-004 vigente + REF-002 caducado for `B2B-EMPRESA2` with discount columns
- [x] 1.3 Update `packages/erp-ports/tests/pricing-reader.test.ts` for expired row and new fields

## 2. Custom tariffs service layer

- [x] 2.1 Create `lib/intranet/custom-tariffs/types.ts` with `CustomTariffLineView` and `GroupOfferView`
- [x] 2.2 Implement `buildCustomTariffsPage` (ERP reader, CMS enrich, validity status Europe/Madrid, wildcard filter)
- [x] 2.3 Implement group offers filter by `customer_group` and active validity
- [x] 2.4 Unit tests: validity Caducado/Vigente, discount derivation fallback, wildcard omission

## 3. Storefront APIs

- [x] 3.1 `GET /api/intranet/custom-tariffs` with B2B guard, sku search, pagination
- [x] 3.2 `POST /api/intranet/custom-tariffs/review-request` — validate expired row, dedupe 7 days, create Payload B2B quote
- [x] 3.3 Integration tests: 401 without session, vigente row has no review action in API metadata, caducado allows POST, 409 on duplicate

## 4. Intranet UI

- [x] 4.1 Replace `/intranet/precios` scaffold with `CustomTariffsPage` (special prices table + group offers block)
- [x] 4.2 Remove `scaffold` entry for precios in `lib/intranet/navigation.ts`
- [x] 4.3 Client components: reference search, status badges, review button with confirmation toast
- [x] 4.4 Verify UI uses design tokens only; responsive table/cards per jeyjo-next patterns

## 5. Verification and docs

- [x] 5.1 Manual/staging check: `empresa2@test.com` sees REF-004 Vigente and expired row with **Solicitar revisión de precio**
- [x] 5.2 Assert group offer REF-003 visible for group 02 customer (US-14 CA4)
- [x] 5.3 Integration or Playwright: expired price shows review button; active price does not (US-14 CA2/CA3)
