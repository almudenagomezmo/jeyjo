## ADDED Requirements

### Requirement: Server-side price resolution endpoint

The storefront SHALL expose a server-only API that resolves `PriceQuote` for a given product SKU using the shared pricing engine and the caller session (anonymous, B2C, or B2B).

#### Scenario: Anonymous request resolves P1

- **WHEN** an unauthenticated client calls the pricing API for SKU REF-001
- **THEN** the response `appliedRule` is `p1_retail`
- **AND** P2 is not exposed in the response body

#### Scenario: B2B session resolves discounted P2

- **WHEN** an authenticated B2B session calls the pricing API for SKU REF-002
- **THEN** the response `netUnit` reflects CA-PRECIOS-002 (9.00 for the fixture)

### Requirement: Latency budget RNF-003

The pricing API SHALL complete within 200 ms at p95 in staging under nominal load for a single-SKU request with warm database connection.

#### Scenario: Performance smoke test

- **WHEN** a staging smoke test runs 100 sequential single-SKU pricing requests
- **THEN** p95 latency is below 200 ms

### Requirement: Dual price presentation uses engine output

`apps/storefront/src/lib/utils/price.ts` SHALL build `PriceView` and `DualPrice` from `PriceQuote` rather than from hardcoded `Product.priceNoVat` stubs.

#### Scenario: getDualPrice uses quote net and gross

- **WHEN** `getPriceView` receives a quote with net 1.00 and gross 1.21
- **THEN** `getDualPrice` in B2C mode shows 1.21 as primary and 1.00 as secondary per RF-011

### Requirement: Price mode header indicator

The storefront header SHALL display the active price mode label ("Precios sin IVA" or "Precios con IVA") based on customer segment per RF-011.

#### Scenario: Anonymous header label (CA-PRECIOS-001)

- **WHEN** no B2B customer is authenticated
- **THEN** the header indicator reads "Precios sin IVA"
