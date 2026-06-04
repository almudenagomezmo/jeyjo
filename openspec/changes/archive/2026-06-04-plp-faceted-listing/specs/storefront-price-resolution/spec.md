## ADDED Requirements

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
