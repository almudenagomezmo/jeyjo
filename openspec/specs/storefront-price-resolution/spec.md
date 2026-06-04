# Storefront price resolution

## Purpose

Server-side price resolution API and RF-011 dual-price presentation wired to `@jeyjo/pricing` for the public storefront.

## Requirements

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

### Requirement: Batch price resolution for PLP

The storefront SHALL expose a server-only batch pricing endpoint or function that resolves `PriceQuote` for multiple SKUs in one request for use on PLP pages, using the shared pricing engine and caller session rules from single-SKU resolution.

#### Scenario: Batch anonymous quotes use P1 only

- **WHEN** an unauthenticated PLP page requests quotes for SKUs REF-001 and REF-002
- **THEN** each quote uses `p1_retail` and the response does not include P2 fields

#### Scenario: Unknown SKU omitted from batch

- **WHEN** the batch includes a SKU that is not publicly visible
- **THEN** that SKU is absent from the result map without failing the whole batch

### Requirement: PLP product cards use PriceQuote not stub prices

`ProductCard` on PLP routes SHALL render dual prices from `PriceQuote` via `getDualPrice` / `getPriceView` helpers, not from hardcoded `Product.priceNoVat` on demo data.

#### Scenario: Card shows dual price from quote

- **WHEN** a PLP card receives a quote with net 1.00 and gross 1.21 for an anonymous visitor in B2C display mode
- **THEN** the card primary and secondary prices match RF-011 presentation for that mode

### Requirement: Price range facet uses resolved quotes

Price range filtering on the PLP SHALL compare against the resolved display price from `PriceQuote` for the active price mode (anonymous P1 net for filter baseline in v1).

#### Scenario: Max price filter uses resolved net

- **WHEN** a user sets maximum price 5.00 and a product quote net is 4.50
- **THEN** the product remains visible in the filtered grid

### Requirement: Single-SKU price resolution for PDP

The storefront SHALL resolve `PriceQuote` for the PDP primary SKU server-side during page load using the same rules as `/api/pricing/resolve`, and pass the quote to the buy box as initial data.

#### Scenario: PDP server prefetch quote

- **WHEN** the PDP page loads for SKU REF-001 as an anonymous visitor
- **THEN** the server-rendered HTML includes a P1-based quote for that SKU without a client-side pricing flash

#### Scenario: PDP pricing API available for refresh

- **WHEN** a client calls `/api/pricing/resolve` with the PDP product SKU
- **THEN** the response matches the server prefetch rules for the same session context

### Requirement: PDP buy box uses PriceQuote not stub prices

`ProductBuyBox` on PDP routes SHALL render dual prices from `PriceQuote` via `getDualPrice` / `getPriceView`, not from hardcoded `Product.priceNoVat` on demo data.

#### Scenario: Buy box shows dual price from quote

- **WHEN** the buy box receives a quote with net 1.00 and gross 1.21 for an anonymous visitor in B2C display mode
- **THEN** the displayed primary and secondary prices match RF-011 for that mode

#### Scenario: Offer badge from quote list price

- **WHEN** a quote includes `listUnit` greater than `netUnit`
- **THEN** the buy box may show the limited-offer badge consistent with PLP card behavior
