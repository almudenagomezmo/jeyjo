## 1. Data model and types

- [x] 1.1 Add Supabase migration `customer_addresses` with RLS policies per `customer_id` (verify: `supabase db reset` or migration apply — authenticated user sees only own rows)
- [x] 1.2 Regenerate `@jeyjo/database-types` and export address types for storefront (verify: `pnpm --filter @jeyjo/database-types build` passes)
- [x] 1.3 Extend Payload `orders` collection with checkout fields from delta spec; run CMS schema push (verify: admin shows `deliveryMethod`, `shippingCost`, `guestEmail`)

## 2. Checkout domain logic

- [x] 2.1 Add `lib/checkout/segment.ts` with `resolveCheckoutSegment(ctx)` and extend `CustomerContext` with `defaultPaymentMethod` (verify: unit test — validated B2B → b2b, pending → b2c)
- [x] 2.2 Add `lib/checkout/shipping-copy.ts` using `SHIPPING_RULES` + B2C/B2B display strings for CA-CHECKOUT-001/002 (verify: test — 38€ B2C → exact copy "Gastos de envío: 5,00 € (IVA incluido)")
- [x] 2.3 Add pure `buildCheckoutTotals(lines, quotes, segment, coupon)` reusing `computeCartSummary` (verify: test — 40€ B2C → shipping 0, total 40)

## 3. Server APIs

- [x] 3.1 Implement `POST /api/checkout/prepare` — validate cart, server pricing batch, return signed summary token (verify: empty cart → 400; fixture cart → totals match tests)
- [x] 3.2 Implement `POST /api/checkout/place-order` — create Payload order with origin, status, snapshots, payment labels (verify: integration test with mocked Payload — orderNumber present)
- [x] 3.3 Add `GET/POST/DELETE /api/account/addresses` for CRUD with RLS (verify: user A cannot read user B addresses)

## 4. Account addresses UI

- [x] 4.1 Replace `/cuenta/direcciones` placeholder with list + form using design tokens only (verify: create address appears in list)
- [x] 4.2 Add "Direcciones" to account sidebar navigation (verify: link active on `/cuenta/direcciones`)

## 5. Checkout UI (storefront)

- [x] 5.1 Create `app/checkout/page.tsx` and `components/checkout/*` — step delivery (methods, guest email, observations) (verify: pickup Alfaro sets shipping 0 in UI summary)
- [x] 5.2 Add review step — line table, shipping line copy, B2C payment radios, B2B read-only payment (verify: CA-CHECKOUT-006 fixture — no card/bizum options)
- [x] 5.3 Add confirmation view `/checkout/confirmacion?order=…` and clear cart on success (verify: after place order cart count 0)
- [x] 5.4 Guard empty cart redirect to `/cart` (verify: `/checkout` with empty store → redirect)

## 6. Cart integration

- [x] 6.1 Enable "Tramitar pedido" on `/cart` linking to `/checkout`; persist demo coupon in `sessionStorage` (verify: apply BLOG5 on cart → checkout shows discount)
- [x] 6.2 Enable minicart "Tramitar" link to `/checkout` (verify: click from header panel navigates)

## 7. Tests and verification

- [x] 7.1 Unit tests: segment, shipping copy, checkout totals (verify: `pnpm --filter storefront test` passes)
- [x] 7.2 Playwright or manual script for CA-CHECKOUT-001, CA-CHECKOUT-002, CA-CHECKOUT-006 on staging (verify: documented in PR notes)
- [x] 7.3 Run `pnpm --filter storefront typecheck` and `build` (verify: no errors)
- [x] 7.4 Document `CHECKOUT_ENABLED`, Payload API env vars in `apps/storefront/.env.example` (verify: example file updated)
