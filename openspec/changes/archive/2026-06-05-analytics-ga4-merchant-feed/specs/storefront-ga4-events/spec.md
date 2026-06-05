## ADDED Requirements

### Requirement: GA4 loads only when configured and enabled

The storefront SHALL load Google Analytics 4 (`gtag.js`) only when `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is set and `NEXT_PUBLIC_GA4_ENABLED` is not `false`, per **RF-028** and **RI-007**.

#### Scenario: GA4 disabled in development

- **WHEN** `NEXT_PUBLIC_GA4_ENABLED` is `false` or measurement ID is empty
- **THEN** no GA4 script tags or network requests to `googletagmanager.com` are emitted from the storefront

#### Scenario: GA4 enabled with valid measurement ID

- **WHEN** `NEXT_PUBLIC_GA4_ENABLED` is true and `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is set
- **THEN** `gtag.js` loads after interactive paint
- **AND** `gtag('config', measurementId)` runs once on init

### Requirement: Storefront tracks standard e-commerce funnel events

The storefront SHALL emit GA4 events `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, and `purchase` with e-commerce item payloads per **RF-028** and **RI-007**.

#### Scenario: Client navigates between App Router pages

- **WHEN** GA4 is enabled and the user navigates from `/` to `/categoria/escritura`
- **THEN** a `page_view` event is sent with the updated page path

#### Scenario: User views a product detail page

- **WHEN** GA4 is enabled and a PDP loads for SKU `REF-001`
- **THEN** a `view_item` event is sent with `item_id` REF-001, product name, and public unit price

#### Scenario: User adds a product to cart

- **WHEN** GA4 is enabled and the user adds SKU `REF-001` with quantity 2
- **THEN** an `add_to_cart` event is sent with matching `items[]`, quantity, and price

#### Scenario: User starts checkout with items

- **WHEN** GA4 is enabled and the checkout flow mounts with a non-empty cart
- **THEN** a `begin_checkout` event is sent once per checkout session with cart value and items

#### Scenario: User completes a paid order

- **WHEN** GA4 is enabled and the user lands on order confirmation with `paid=1` and order number `WEB-1001`
- **THEN** a `purchase` event is sent with `transaction_id` WEB-1001, order value, tax, shipping, and line items

### Requirement: GA4 helpers are centralized and testable

The storefront SHALL expose pure GA4 tracking helpers in `lib/analytics/ga4.ts` that no-op when GA4 is disabled and SHALL be unit-testable without a browser network.

#### Scenario: Helper no-op when disabled

- **WHEN** `trackAddToCart` is called with GA4 disabled
- **THEN** no `gtag` invocation occurs

#### Scenario: Unit tests cover item mapping

- **WHEN** `pnpm --filter storefront test` runs analytics tests
- **THEN** item payload mapping for cart lines and order snapshots passes

### Requirement: Purchase may be duplicated via Measurement Protocol

When `GA4_API_SECRET` is configured, the storefront SHALL optionally send a server-side GA4 Measurement Protocol `purchase` event for the same `transaction_id` after payment confirmation, per **RI-007**.

#### Scenario: Server-side purchase with API secret

- **WHEN** `GA4_API_SECRET` is set and a paid order confirmation loads
- **THEN** `POST /api/analytics/ga4-purchase` sends a Measurement Protocol event with the same `transaction_id` as the client event

#### Scenario: No server call without API secret

- **WHEN** `GA4_API_SECRET` is unset
- **THEN** only the client `purchase` event is attempted

### Requirement: B2B intranet routes are excluded from GA4

GA4 tracking SHALL apply to the public storefront only and MUST NOT load on B2B intranet routes under `/intranet`.

#### Scenario: B2B user opens intranet

- **WHEN** an authenticated user navigates within `/intranet`
- **THEN** no GA4 script or e-commerce events are emitted
